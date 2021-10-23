import { ModelTables } from './../../declarations.d';
import SimpleQuery, { ConditionOperators, PossibleColumns, quotedColumn, quotedVal, SelectedModel } from "./simple-query";

export default class SimpleQueryConditionBuilder<TName extends keyof ModelTables>{
    constructor(public fromTable?: string){
    }

    public quoteValOrColumn(text: any){
        if(!this.isString(text))
            return quotedVal(text);
        if((text as string).includes("'"))
            return text;
        if((text as string).includes('"') || (text as string).includes('.'))
            return text;
        return `'${text}'`;
    }

    isString(val: any){
        return typeof val === 'string' || val instanceof String;
    }

    _wheres: Array<SimpleQueryWhere>=[];
    where(columnOrVal1: PossibleColumns | (string &  { fromT?: any}) , columnOrVal2: any): SimpleQuery<TName>;
    where(columnOrVal1: PossibleColumns | (string &  { fromT?: any}), op: ConditionOperators, columnOrVal2: keyof TName | (any &  { fromT?: any})  ): SimpleQuery<TName>;
    
    where(columnOrVal1: PossibleColumns | (string &  { fromT?: any}), arg2: any, arg3?: any): any{
        //an operator has been applied
        if(arg3){
            //val can be an column or value. we will consider
            this._wheres.push(new SimpleQueryWhere('AND',`${this.quoteValOrColumn(columnOrVal1)} ${arg2} ${this.quoteValOrColumn(arg3)}`) )
        }
        else{
            //val can be an column or value
            this._wheres.push(new SimpleQueryWhere('AND',`${this.quoteValOrColumn(columnOrVal1)} = ${this.quoteValOrColumn(arg2)}`) )
        }
        return this;
    }
    whereCol(columnOrVal1: keyof SelectedModel<TName> | (string &  { fromT?: any}) , columnOrVal2: any): SimpleQuery<TName>;
    whereCol(columnOrVal1: keyof SelectedModel<TName> | (string &  { fromT?: any}), op: ConditionOperators, columnOrVal2: keyof TName | (any &  { fromT?: any})  ): SimpleQuery<TName>;
    //like where but first arg is always a column
    whereCol(columnOrVal1: keyof SelectedModel<TName> | (string &  { fromT?: any}), arg2: any, arg3?: any){
        return this.where(quotedColumn(columnOrVal1.toString(), this.fromTable), arg2, arg3)
    }

    orWhere(columnOrVal1: PossibleColumns | (string &  { fromT?: any}) , columnOrVal2: any): SimpleQuery<TName>;
    orWhere(columnOrVal1: PossibleColumns | (string &  { fromT?: any}), op: ConditionOperators, columnOrVal2: keyof TName | (any &  { fromT?: any})  ): SimpleQuery<TName>;
    orWhere(columnOrVal1: PossibleColumns | (string &  { fromT?: any}), arg2: any, arg3?: any): any{
        //an operator has been applied
        if(arg3){
            //val can be an column or value. we will consider
            this._wheres.push(new SimpleQueryWhere('OR',`${this.quoteValOrColumn(columnOrVal1)} ${arg2} ${this.quoteValOrColumn(arg3)}`) )
        }
        else{
            //val can be an column or value
            this._wheres.push(new SimpleQueryWhere('OR',`${this.quoteValOrColumn(columnOrVal1)} = ${this.quoteValOrColumn(arg2)}`) )
        }
        return this;
    }
    whereNotNull(column: PossibleColumns | (string &  { fromT?: any})){
        this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} IS NOT NULL`) )
        return this;
    }
    orWhereNotNull(column: PossibleColumns | (string &  { fromT?: any})){
        this._wheres.push(new SimpleQueryWhere('OR',`${quotedColumn(column.toString())} IS NOT NULL`) )
        return this;
    }
    whereNull(column: PossibleColumns | (string &  { fromT?: any})){
        this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} IS NULL`) )
        return this;
    }
    orWhereNull(column: PossibleColumns | (string &  { fromT?: any})){
        this._wheres.push(new SimpleQueryWhere('OR',`${quotedColumn(column.toString())} IS NULL`) )
        return this;
    }
    whereRaw(qstring: string){
        this._wheres.push(new SimpleQueryWhere('AND',qstring) )
        return this;
    }
    whereColIn(column: keyof SelectedModel<TName> | (string &  { fromT?: any})  , values: any[]){
        // if(values && values.length) //allow error to be corrected by caller
            this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} IN (${values.map(item=>quotedVal(item) ).join(", ")})`) )
        return this;
    }
    whereIn(column: PossibleColumns | (string &  { fromT?: any}), values: any[]){
        // if(values && values.length) //allow error to be corrected by caller
            this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} IN (${values.map(item=>quotedVal(item)).join(", ")})`) )
        return this;
    }
    whereNotIn(column: PossibleColumns | (string &  { fromT?: any}), values: any[]){
        // if(values && values.length) //allow error to be corrected by caller
            this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} NOT IN (${values.map(item=>quotedVal(item)).join(", ")})`) )
        return this;
    }
    whereILike(column: PossibleColumns | (string &  { fromT?: any}), value: string){
        this._wheres.push(new SimpleQueryWhere('AND',`${quotedColumn(column.toString())} iLike '%${value}%'`) )
        return this;
    }
    whereCondition(callback: (conditionBuilder: SimpleQueryConditionBuilder<TName>)=>void){
        const cond =new SimpleQueryConditionBuilder<TName>();
        callback(cond)
        return this.whereRaw(`(${cond.conditionString})`)
    }

    get conditionString(){
        let condition = "";
        for (const wh of this._wheres) {
            if(condition.length)
                condition+=` ${wh.operator} `
            condition+=wh.condition
        }
        return condition;
    }

}

class SimpleQueryWhere{
    constructor(public operator: WhereOperators, public condition: string ){
    }
}

export type WhereOperators =  'AND' | 'OR';