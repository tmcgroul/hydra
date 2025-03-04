import { GraphQLEnumType } from 'graphql';
import { Container, Inject, Service } from 'typedi';

import { ColumnType, WhereOperator } from '../torm';
import { Config } from '../core';

export type FieldType =
  | 'boolean'
  | 'date'
  | 'dateonly'
  | 'datetime'
  | 'email'
  | 'enum'
  | 'float'
  | 'id'
  | 'integer'
  | 'json'
  | 'numeric'
  | 'string'
  | 'bytea';

export interface DecoratorCommonOptions {
  apiOnly?: boolean;
  dbOnly?: boolean;
  description?: string;
  editable?: boolean;
  filter?: boolean | WhereOperator[];
  nullable?: boolean;
  readonly?: boolean;
  sort?: boolean;
  writeonly?: boolean;
  isArray?: boolean;
}

export interface ColumnMetadata extends DecoratorCommonOptions {
  type: FieldType;
  propertyName: string;
  dataType?: ColumnType; // int16, jsonb, etc...
  default?: any;
  gqlFieldType?: Function;
  enum?: GraphQLEnumType;
  enumName?: string;
  unique?: boolean;
  array?: boolean;
}

export type ColumnOptions = Partial<ColumnMetadata>;

export interface RelationMetadata {
  relModelName: string;
  propertyName: string;
  isList: boolean;
}

export interface ModelMetadata {
  abstract?: boolean;
  filename?: string; // optional because Class decorators added after field decorators
  klass?: any; // optional because Class decorators added after field decorators
  name: string;
  columns: ColumnMetadata[];
  apiOnly?: boolean;
  dbOnly?: boolean;
  relations: RelationMetadata[];
}

@Service('MetadataStorage')
export class MetadataStorage {
  enumMap: { [table: string]: { [column: string]: any } } = {};
  classMap: { [table: string]: any } = {};
  models: { [table: string]: ModelMetadata } = {};
  interfaces: string[] = [];
  baseColumns: ColumnMetadata[];

  decoratorDefaults: Partial<ColumnMetadata>;

  constructor(@Inject('Config') readonly config?: Config) {
    if (!config) {
      config = Container.get('Config');
    }
    config = config as Config; // `config` needs to be optional in the constructor for the global instantiation below

    this.decoratorDefaults = {
      apiOnly: false,
      dbOnly: false,
      editable: true, // Deprecated
      // `true` by default, provide opt-out for backward compatability
      // V3: make this false by default
      filter: config.get('FILTER_BY_DEFAULT') !== 'false',
      nullable: false,
      readonly: false,
      sort: config.get('FILTER_BY_DEFAULT') !== 'false',
      unique: false,
      writeonly: false,
    };

    this.baseColumns = [
      {
        propertyName: 'id',
        type: 'id',
        filter: true,
        nullable: false,
        sort: false,
        unique: true,
        editable: false,
      },
      {
        propertyName: 'createdAt',
        type: 'date',
        editable: false,
        filter: true,
        nullable: false,
        sort: true,
        unique: false,
      },
      {
        propertyName: 'createdById',
        type: 'id',
        editable: false,
        filter: true,
        nullable: false,
        sort: false,
        unique: false,
      },
      {
        propertyName: 'updatedAt',
        type: 'date',
        editable: false,
        filter: true,
        nullable: true,
        sort: true,
        unique: false,
      },
      {
        propertyName: 'updatedById',
        type: 'id',
        editable: false,
        filter: true,
        nullable: true,
        sort: false,
        unique: false,
      },
      {
        propertyName: 'deletedAt',
        type: 'date',
        editable: false,
        filter: true,
        nullable: true,
        sort: true,
        unique: false,
      },
      {
        propertyName: 'deletedById',
        type: 'id',
        editable: false,
        filter: true,
        nullable: true,
        sort: false,
        unique: false,
      },
      {
        type: 'integer',
        propertyName: 'version',
        editable: false,
        filter: false,
        nullable: false,
        sort: false,
        unique: false,
      },
    ];
  }

  // Adds a class so that we can import it into classes.ts
  // This is typically used when adding a strongly typed JSON column
  // using JSONField with a gqlFieldType
  addClass(name: string, klass: any, filename: string) {
    this.classMap[name] = {
      filename,
      klass,
      name,
    };
  }

  addModel(name: string, klass: any, filename: string, options: Partial<ModelMetadata> = {}) {
    if (this.interfaces.indexOf(name) > -1) {
      return; // Don't add interface types to model list
    }

    this.classMap[name] = {
      filename,
      klass,
      name,
    };

    // Just add `klass` and `filename` to the model object
    this.models[name] = {
      ...this.models[name],
      klass,
      filename,
      ...options,
    };
  }

  addEnum(
    modelName: string,
    columnName: string,
    enumName: string,
    enumValues: any,
    filename: string,
    options: ColumnOptions
  ) {
    this.enumMap[modelName] = this.enumMap[modelName] || {};
    this.enumMap[modelName][columnName] = {
      enumeration: enumValues,
      filename,
      name: enumName,
    };

    // the enum needs to be passed so that it can be bound to column metadata
    options.enum = enumValues;
    options.enumName = enumName;
    this.addField('enum', modelName, columnName, options);
  }

  getModelRelation(modelName: string) {
    return this.models[modelName].relations;
  }

  addModelRelation(options: any) {
    const { modelName, relModelName, propertyName, isList } = options;
    if (!modelName || !relModelName || !propertyName || isList === undefined) {
      throw Error(
        `Missing decorator options for ${modelName}. Make sure you provide all the required props(modelName, relModelName, propertyName, isList)`
      );
    }
    if (!this.models[modelName]) {
      this.models[modelName] = {
        name: modelName,
        columns: Array.from(this.baseColumns),
        relations: [],
      };
    }

    this.models[modelName].relations.push({
      relModelName,
      propertyName,
      isList,
    });
  }

  getModels() {
    return this.models;
  }

  getModel(name: string): ModelMetadata {
    return this.models[name];
  }

  getEnum(modelName: string, columnName: string) {
    if (!this.enumMap[modelName]) {
      return undefined;
    }
    return this.enumMap[modelName][columnName] || undefined;
  }

  addField(
    type: FieldType,
    modelName: string,
    columnName: string,
    options: Partial<ColumnMetadata> = {}
  ) {
    if (this.interfaces.indexOf(modelName) > -1) {
      return; // Don't add interfaces
    }

    if (!this.models[modelName]) {
      this.models[modelName] = {
        name: modelName,
        columns: Array.from(this.baseColumns),
        relations: [],
      };
    }

    this.models[modelName].columns.push({
      type,
      propertyName: columnName,
      ...this.decoratorDefaults,
      ...options,
    });
  }

  uniquesForModel(model: ModelMetadata): string[] {
    return model.columns.filter((column) => column.unique).map((column) => column.propertyName);
  }

  addInterfaceType(name: string) {
    this.addModel(name, null, '', { abstract: true });
  }
}

export function getMetadataStorage(): MetadataStorage {
  if (!(global as any).WarthogMetadataStorage) {
    // Since we can't use DI to inject this, just call into the container directly
    (global as any).WarthogMetadataStorage = Container.get('MetadataStorage');
  }
  return (global as any).WarthogMetadataStorage;
}
