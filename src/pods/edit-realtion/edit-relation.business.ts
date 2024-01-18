import { DropdownOptionVm, PkOptionVm } from '@/common/components';
import { GUID, GenerateGUID } from '@/core/model';
import {
  DatabaseSchemaVm,
  FieldVm,
  RelationType,
  RelationVm,
  TableVm,
} from '@/core/providers/canvas-schema';
import { RelationFormVm } from './edit-relation.vm';

// TODO: Test - this mapper needs to be updated when an ID relation appears.
export const mapRelationFormVmToRelaionVM = (
  values: RelationFormVm,
  relationId?: GUID
): RelationVm => {
  return {
    id: relationId || GenerateGUID(),
    type: values.type.label as RelationType,
    fromTableId: values.fromTableId.id,
    fromFieldId: values.fromFieldId.id,
    toFieldId: values.toFieldId.id,
    toTableId: values.toTableId.id,
  };
};

export const mapRelationsTipeToDropdonwVm = (): DropdownOptionVm[] => [
  { id: '1', label: '1:1' },
  { id: '2', label: '1:M' },
  { id: '3', label: 'M:1' },
];

// TODO:
// #91 Disable toolbar add relation button when there are no relations
//https://github.com/Lemoncode/mongo-modeler/issues/91

// TODO:
// #118 Add unit tests to edit relation business
//https://github.com/Lemoncode/mongo-modeler/issues/118

const mapTableToDropdonwVm = (table: TableVm): DropdownOptionVm => ({
  id: table.id,
  label: table.tableName,
});

export const mapTableListToDropdonwVm = (
  canvasSchema: DatabaseSchemaVm
): DropdownOptionVm[] =>
  canvasSchema.tables.map(
    (table): DropdownOptionVm => mapTableToDropdonwVm(table)
  );

const returnTablefromCanvasShema = (
  id: GUID,
  canvasSchema: DatabaseSchemaVm
): TableVm => {
  const table = canvasSchema.tables.find(table => table.id === id);
  if (!table) {
    throw Error(`Table with id ${id} does not exist`);
  }
  return table;
};

const returnOptionsFromTable = (fields: FieldVm[]): PkOptionVm[] =>
  fields.map((field): PkOptionVm => {
    if (field.children && field.children.length > 0) {
      return {
        id: field.id,
        label: field.name,
        children: returnOptionsFromTable(field.children),
      };
    }
    return { id: field.id, label: field.name };
  });

const emptyFields: FieldVm[] = [
  { id: '', name: '', type: 'string', PK: false },
];

export const mapTablesFieldsToPkOptionVm = (
  id: GUID,
  canvasSchema: DatabaseSchemaVm
): PkOptionVm[] => {
  if (!id) {
    return returnOptionsFromTable(emptyFields);
  }
  const table = returnTablefromCanvasShema(id, canvasSchema);
  const options = returnOptionsFromTable(table.fields);

  return options;
};

//!!Need refactor all functions from here
const findOptionTable = (id: GUID, canvasSchema: DatabaseSchemaVm) => {
  const findTable = returnTablefromCanvasShema(id, canvasSchema);
  return mapTableToDropdonwVm(findTable);
};

const fiendFieldRecursively = (
  fieldOptionList: PkOptionVm[],
  fieldId: GUID
): PkOptionVm | null => {
  for (const field of fieldOptionList) {
    if (field.id === fieldId) {
      return field;
    }
    if (field.children) {
      const findField = fiendFieldRecursively(field.children, fieldId);
      if (findField !== null) {
        return findField;
      }
    }
  }
  return null;
};

const findOptionField = (
  tableId: GUID,
  fieldId: GUID,
  canvasSchema: DatabaseSchemaVm
): PkOptionVm => {
  const findTable = returnTablefromCanvasShema(tableId, canvasSchema);
  const fieldOptionList = returnOptionsFromTable(findTable.fields);
  const findField = fiendFieldRecursively(fieldOptionList, fieldId);
  if (!findField) {
    throw new Error(`Field with ID ${fieldId} not found`);
  }
  return findField;
};

const findOptionType = (type: RelationType): DropdownOptionVm => {
  const typeOptionList = mapRelationsTipeToDropdonwVm();
  const findType = typeOptionList.find(typeOption => typeOption.label === type);
  if (!findType) {
    throw Error(`Relation type ${type} has not valid value`);
  }
  return findType;
};

const findRelation = (relations: RelationVm[], id: GUID) => {
  const relationId = relations.find(relation => relation.id === id);
  if (!relationId) {
    throw Error(`Relation for ${relationId} is missing`);
  }
  return relationId;
};

export const createInitialIdValues = (
  relationId: GUID,
  canvasSchema: DatabaseSchemaVm
): RelationFormVm => {
  const relation = findRelation(canvasSchema.relations, relationId);

  const optionFromTableTd = findOptionTable(relation.fromTableId, canvasSchema);

  const optionToTableId = findOptionTable(relation.toTableId, canvasSchema);

  const optionFromFieldId = findOptionField(
    relation.fromTableId,
    relation.fromFieldId,
    canvasSchema
  );

  const optionToFieldId = findOptionField(
    relation.toTableId,
    relation.toFieldId,
    canvasSchema
  );

  const optionType = findOptionType(relation.type);

  return {
    fromTableId: optionFromTableTd,
    toTableId: optionToTableId,
    fromFieldId: optionFromFieldId,
    toFieldId: optionToFieldId,
    type: optionType,
  };
};

export const createInitialValues = (): RelationFormVm => ({
  fromFieldId: { id: '', label: '' },
  fromTableId: { id: '', label: '' },
  toFieldId: { id: '', label: '' },
  toTableId: { id: '', label: '' },
  type: { id: '1', label: '1:1' },
});
