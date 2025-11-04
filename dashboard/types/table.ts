import { ReactNode } from 'react';

/**
 * Represents the definition of a column in a DataTable.
 * @template TData The type of the data for the row.
 */
export interface ColumnDef<TData> {
  /**
   * The accessor key for the column, used to retrieve the value from the data object.
   */
  accessorKey: Extract<keyof TData, string>;
  /**
   * The content to render in the table header for this column.
   */
  header: ReactNode;
  /**
   * An optional function to render a custom cell component.
   * If not provided, the component will render the direct value from the data object.
   * @param row The full data object for the current row.
   * @returns The ReactNode to render in the cell.
   */
  cell?: (row: TData) => ReactNode;
} 