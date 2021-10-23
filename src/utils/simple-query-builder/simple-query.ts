import { Params } from '@feathersjs/feathers';
import { isArray, isObject, isNumber, String } from 'lodash';
import moment from 'moment';
import { BindOrReplacements } from 'sequelize/types';
import { ModelTables, ServiceTypes } from "../../declarations";
import paginateQueryGet, {executeSql} from "./paginate-query-get";
import SimpleQueryConditionBuilder from './simple-query-condition-builder';

type NameType<T> = T | 'check'

export type Columns<TableName extends keyof ModelTables, L = keyof ModelTables[TableName]> = 
`${TableName extends string? TableName: never}.${L extends string? (NameType<L> extends NameType<Uppercase<L>>? L: `"${L}"`) : never}`;

type _PossibleColumns<Models> = Models extends keyof ModelTables? Columns<Models>: never;
export type PossibleColumns = _PossibleColumns<keyof ModelTables>;
interface ExtraProps {
    [key: string]: any,
}
export type SelectedModel<TName>= TName extends keyof ModelTables? (ModelTables[TName]): never;


class SimpleQuery< TName extends keyof ModelTables =never > extends SimpleQueryConditionBuilder<TName>{

    constructor(public fromTable?: string){
        super(...arguments);
    }
    // static service<L extends keyof ModelTables> (location: L): ModelTables[L]{
    //     return new L();
    // }
    static model<L extends keyof ModelTables>(table: L| (string &  { fromT?: any})) { 
        return new SimpleQuery<L>(table as any)
    }
    static TableName(fromTable: string ){
        return new SimpleQuery(fromTable as any)
    }
   

    private innerQuery: SimpleQuery | undefined;
    static InnerQuery(innerSql: SimpleQuery ){
        const sq = new SimpleQuery();
        sq.innerQuery = innerSql;
        return sq;
    }

    private _selects: Array<string>=[];
    select(qString: PossibleColumns | (string &  { fromT?: any})='*'): SimpleQuery<TName>{
        if(qString=='*'){
            this._selects.push(this.fromTable? `${this.fromTable}.*`: '*');
            return this;
        }
        this._selects.push(qString.toString())
        return this;
    }
    
    selectColumns(...columns: Array<PossibleColumns | (string &  { fromT?: any})>): SimpleQuery<TName>{
        this._selects.push(
            (columns as Array<string>).map( (col:string)=> `${quotedColumn(col)}` ).join(',') 
        );
        return this;
    }
    selectDistinctCol(col: PossibleColumns| (string &  { fromT?: any})): SimpleQuery<TName>{
        this._selects.push( `DISTINCT ${quotedColumn(col.toString())}` );
        return this;
    }
    
    search(columns: string[]|Array<PossibleColumns | (string &  { fromT?: any})>, value: string): SimpleQuery<TName>{
        if (!value)
            return this;
        this.whereCondition((cb) => {
            for (const column of columns) {
                //column might have been an include property so we check and use its select string
                //but an include but wasn't included in the query then we skip
                if(this._includesImpl[column.toString()] && !this._includes.includes(column.toString()))
                    continue;
                cb.orWhere(this._includesImpl[column.toString()]? quotedColumn(this._includesImpl[column.toString()].selectColumn, this.fromTable): quotedColumn(column.toString(), this.fromTable), 'iLike', `'%${value}%'`)
            }
        })
        return this;
    }

    /**
     * generates a where condition for all properties in params.query or any object
     * @param paramsQuery 
     * @param excludedColumns 
     */
    filter(paramsQuery: any, excludedColumns: Array<PossibleColumns | (string &  { fromT?: any})> = []): SimpleQuery<TName> {
        const filters = paramsQuery || {}
        for (const column in paramsQuery) {
            if (Object.prototype.hasOwnProperty.call(paramsQuery, column)) {
                //excludes
                if (excludedColumns.includes(column))
                    continue;
                const val = paramsQuery[column]
                //exclude keyed properties too
                if (column.charAt(0) != '$') {
                    if (isArray(val)) {
                        this.whereIn(column, val)
                    }
                    else if (isObject(val)) {
                        this.whereCondition((cb) => {
                            for (const operator in val) {
                                this.whereRaw(`${quotedColumn(column, this.fromTable)} ${operator} ${quotedVal(val)}`)
                            }
                        })
                    } else {
                        this.whereRaw(`${quotedColumn(column, this.fromTable)} = ${quotedVal(val)}`)
                    }
                }

            }
        }
        return this;
    }

    private _joins: Array<string>=[];
    joinRaw(qString: string): SimpleQuery<TName>{
        if(this._joins.includes(qString))
            return this;
        this._joins.push(qString)
        return this;
    }

    // whereTest(col: PossibleColumns<TName>){
        // const furniture = [...this.joinedTable] as const;
        // type L = typeof furniture[number];
    //     return new SimpleQuery<L>(table as any)
    // }

    joinedTables: string[]=[];

    leftJoin(table: keyof ModelTables | (string &  { fromT?: any}), column1: PossibleColumns| (string &  { fromT?: any}), column2: PossibleColumns| (string &  { fromT?: any})): SimpleQuery<TName>;
    leftJoin(table: keyof ModelTables | (string &  { fromT?: any}), onOperator: ConditionOperators, column1: PossibleColumns| (string &  { fromT?: any}), column2: PossibleColumns| (string &  { fromT?: any})): SimpleQuery<TName>;

    leftJoin(table: keyof ModelTables | (string &  { fromT?: any}), arg2: any, arg3:any, arg4?:any){
        if(this.joinedTables.includes(table))
            return this;
        if(arg4)
            this._joins.push(`LEFT JOIN ${table} ON ${this.quoteValOrColumn(arg2)} ${arg3} ${this.quoteValOrColumn(arg4)}` )
        else
            this._joins.push(`LEFT JOIN ${table} ON ${this.quoteValOrColumn(arg2)} = ${this.quoteValOrColumn(arg3)}` )
        return this;
    }

    rightJoin(table: keyof ModelTables | (string &  { fromT?: any}), column1: PossibleColumns| (string &  { fromT?: any}), column2: PossibleColumns| (string &  { fromT?: any})): SimpleQuery<TName>;
    rightJoin(table: keyof ModelTables | (string &  { fromT?: any}), onOperator: ConditionOperators, column1: PossibleColumns| (string &  { fromT?: any}), column2: PossibleColumns| (string &  { fromT?: any})): SimpleQuery<TName>;

    rightJoin(table: keyof ModelTables | (string &  { fromT?: any}), arg2: any, arg3:any, arg4?:any){
        if(this.joinedTables.includes(table))
            return this;
        if(arg4)
            this._joins.push(`RIGHT JOIN ${table} ON ${this.quoteValOrColumn(arg2)} ${arg3} ${this.quoteValOrColumn(arg4)}` )
        else
            this._joins.push(`RIGHT JOIN ${table} ON ${this.quoteValOrColumn(arg2)} = ${this.quoteValOrColumn(arg3)}` )
        return this;
    }

    private _groupBys: Array<string>=[];
    groupBy(col: Array<PossibleColumns | (string &  { fromT?: any})>): SimpleQuery<TName>{
        this._groupBys.push(col.join(", "))
        return this;
    }

    groupByString(col: PossibleColumns | (string &  { fromT?: any})): SimpleQuery<TName>{
        this._groupBys.push(col.toString())
        return this;
    }

    applyPeriod(col: PossibleColumns | (string &  { fromT?: any}), period: {from: Date, to: Date}): SimpleQuery<TName> {
        if(col && period.from){
            this.whereRaw(`${quotedColumn(col.toString())} >='${period.from}'`)
        }
        if(col && period.to){
            this.whereRaw(`${quotedColumn(col.toString())} <='${moment(period.to).format('YYYY-MM-DD')} 23:59:59'`)
        }
        return this;
    }
    
    private _orderBys: Array<string>=[];
    orderBy(col: PossibleColumns| (string &  { fromT?: any}), ascDesc: "asc" | "desc"): SimpleQuery<TName>{
        //advisable not to quote column
        this._orderBys.push(`${col.toString()} ${ascDesc}`)
        return this;
    }
    orderBy$sort(col: Object): SimpleQuery<TName>{
        this.orderBy(Object.keys(col)[0], Object.values(col)[0]==1? "asc" :"desc")
        return this;
    }
    private _limit: number | null=null;
    limit(lim: number): SimpleQuery<TName>{
        this._limit = lim;
        return this;
    }
    private _skip: number | null=null;
    skip(ski: number): SimpleQuery<TName>{
        this._skip = ski;
        return this;
    }
    private _distinctOn: string ="";
    distinctOn(columns: Array<PossibleColumns | (string &  { fromT?: any})>): SimpleQuery<TName>{
        this._distinctOn = `DISTINCT ON (${columns.map(col=>quotedColumn(col.toString())).join(", ")})`;
        return this;
    }

    excludeDeleted(): SimpleQuery<TName>{
        this.whereRaw(this.fromTable+'."deleted"=false')
        return this;
    }

    private _includesImpl:SimpleQueryIncludes={};
    private _includes:string[]=[];
    include($includes: string[], includesImpl: SimpleQueryIncludes): SimpleQuery<TName> {
        this._includesImpl = includesImpl;
        this._includes =$includes;
        if ($includes){
            for (const inc of $includes) {
                if(!includesImpl[inc])
                    throw new Error(inc+" is not an include implementation");
                    
                if (!this._joins.includes(includesImpl[inc].joinStatement))
                    this.joinRaw(includesImpl[inc].joinStatement)
                this.select(`${includesImpl[inc].selectColumn} as "${inc}"`)
            }
        }
        return this;
    }

    includeAssociate(){
        // let sequelize: Sequelize = this.app.get('sequelizeClient')
        // console.log(sequelize.models['org_subscriptions'].associations);
    }
    
    clone(): SimpleQuery<TName>{
        let cl = new SimpleQuery<TName>(this.fromTable);
        cl._selects = [...this._selects];
        cl._wheres = [...this._wheres];
        cl._joins = [...this._joins];
        cl._groupBys = [...this._groupBys];
        cl._orderBys = [...this._orderBys];
        cl._limit = this._limit;
        cl._skip = this._skip;
        return cl;
    }

    toSql(): string{
        let selectString = "";
        for (const sel of this._selects) {
            if(selectString.length)
                selectString+=", "
            selectString+=sel
        }

        let joinString = "";
        for (const jst of this._joins) {
            joinString+=` ${jst} `
        }

        const condition = this.conditionString;

        let groupString = "";
        for (const grp of this._groupBys) {
            if(groupString.length)
                groupString+=", "
            groupString+=grp
        }
        if(groupString.length)
            groupString= " GROUP BY "+groupString

        let orderString = "";
        for (const ord of this._orderBys) {
            if(orderString.length)
                orderString+=", "
            orderString+=ord
        }
        if(orderString.length)
            orderString= " ORDER BY "+orderString

        return `SELECT ${this._distinctOn} ${selectString || '*'} FROM ${this.innerQuery? "("+this.innerQuery.toSql()+") as innerQuery" :this.fromTable}
        ${joinString.length? joinString :""}
        ${condition.length? " WHERE "+condition:''} 
        ${groupString.length? groupString :""}
        ${orderString.length? orderString : ""}
        ${this._limit? " LIMIT "+this._limit:""}
        ${this._skip? " SKIP "+this._skip:""}
        `.replace(/(\r\n|\n|\r)/gm, "");
    }

    _bind?: BindOrReplacements;
    bind(bind: BindOrReplacements){
        if(!this._bind)
            this._bind = bind;
        else
            this._bind = {...this._bind, ...bind}
        return this;
    }

    get():Promise<(SelectedModel<TName> & ExtraProps)[]>{
        return executeSql(this.toSql(), this._bind);
    }

    async first():Promise<SelectedModel<TName> | null>{
        this.limit(1);
        let res = await this.get();
        return res.length> 0? res[0] : null;
    }
    findById(id:any, throwNotFound:boolean): Promise<SelectedModel<TName>>
    findById(id:any): Promise<SelectedModel<TName> | null>
    async findById(id:any, throwNotFound:boolean=false): Promise<SelectedModel<TName> | null> {
        const res =await this.where(quotedColumn('id', this.fromTable),'=', id).first();
        if(throwNotFound && !res)
            throw new Error("Record not found");
        return res;
    }
    
    getColumns(...columns: Array<PossibleColumns| (string &  { fromT?: any})>):Promise<SelectedModel<TName>[] | any[]>{
        if(columns){
            this._selects =[];
            this.selectColumns(...columns)
        }
        return executeSql(this.toSql(), this._bind);
    }

    paginate(paginationParams: { $skip: number, $limit: number })
        : Promise<{
            data: SelectedModel<TName>[],
            limit: number,
            skip: number,
            total: number
        }> {
        if (!paginationParams.$skip || isNaN(paginationParams.$skip))
            paginationParams.$skip = 0;
        // throw new Error("invalid $skip param "+ paginationParams.$skip);
        if (!paginationParams.$limit || isNaN(paginationParams.$limit))
            paginationParams.$limit = 20;
        // throw new Error("invalid $limit param "+ paginationParams.$limit);

        return paginateQueryGet(this.toSql(), paginationParams, this._bind);
    }
    async sum(column: PossibleColumns| (string &  { fromT?: any})): Promise<number>{
        return ( (await executeSql(`SELECT SUM(${quotedColumn(column.toString())}) as total FROM (${this.toSql()}) as sumQuery`, this._bind))[0] as any).total as number
    }

    async count(): Promise<number>{
        return ( (await executeSql(`SELECT COUNT(*) as count FROM (${this.toSql()}) as countQuery`, this._bind))[0] as any).count as number
    }

    async hasResults(): Promise<boolean>{
        return (await this.count()) >0;
    }
}

export type ConditionOperators =  '=' | '<' | '<=' | '>' | '>=' | '!=' | 'iLike' | 'IN' | 'NOT IN';

export default SimpleQuery;

export function quotedVal(value: any){
    if(isNumber(value))
        return value;
    if(typeof value === 'string' || value instanceof String){
        return value.includes("'")? value : `'${value}'`;
    }
    return `'${value}'`;
}
export function quotedColumn(column: string, prependTable=""){
    if(column.includes('"'))
        return column;
    if(column.includes('.'))
        return column;
    //if string is camel case
    if(column.toLowerCase()!=column && !column.includes('"')){
        return (prependTable?`${prependTable}.`:'')+`"${column}"`;
    }
    return (prependTable?`${prependTable}.`:'')+`"${column}"`;
}

export interface SimpleQueryIncludes {
    [key: string]: { selectColumn: string, joinStatement: string },
}