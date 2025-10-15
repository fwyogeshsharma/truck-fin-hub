import Database from 'better-sqlite3';
import * as path from 'path';

export interface SQLiteConfig {
  path: string;
  options: {
    readonly: boolean;
    fileMustExist: boolean;
    timeout: number;
    verbose?: (message?: any, ...additionalArgs: any[]) => void;
  };
  pragma: {
    foreignKeys: boolean;
    journalMode: string;
  };
}

export const sqliteConfig: SQLiteConfig = {
  path: path.join(process.cwd(), 'data', 'truck-fin-hub.db'),
  options: {
    readonly: false,
    fileMustExist: false,
    timeout: 5000,
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  },
  pragma: {
    foreignKeys: true,
    journalMode: 'WAL',
  },
};

export default sqliteConfig;
