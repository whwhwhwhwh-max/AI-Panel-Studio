declare module 'sql.js' {
  interface Database {
    run(sql: string, params?: any[]): Database
    exec(sql: string, params?: any[]): QueryExecResult[]
    prepare(sql: string): Statement | null
    export(): Uint8Array
    close(): void
    create_function(name: string, func: (...args: any[]) => any): void
    getRowsModified(): number
  }

  interface Statement {
    bind(params: any[]): boolean
    step(): boolean
    getAsObject(): Record<string, any>
    get(): any[]
    free(): boolean
    reset(): void
  }

  interface QueryExecResult {
    columns: string[]
    values: any[][]
  }

  interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}
