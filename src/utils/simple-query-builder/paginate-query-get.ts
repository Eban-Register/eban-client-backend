import { Sequelize, Op, QueryTypes, BindOrReplacements } from 'sequelize';
import app from '../../app';

export default async function( queryString: string, paginationParams: {$skip: number, $limit: number}| any, bind?: BindOrReplacements){
    let sequelize: Sequelize = app.get('sequelizeClient')
    /**Get total count */
    let countQuery: any =  `SELECT COUNT(*) FROM (${queryString}) as countQuery;`;
    // return countQuery;
    let countResult:any = await sequelize.query(countQuery, { type: QueryTypes.SELECT, bind});
    let total = Number(countResult[0].count);
    /**Add pagination to actual query */
    let {$skip, $limit}:any = paginationParams;
    if(!$skip) $skip=0; if(!$limit) $limit=10;

    let sqlQuery = queryString+ ` LIMIT ${$limit} OFFSET ${$skip} `

    let pageResult:any = await sequelize.query(sqlQuery , { type: QueryTypes.SELECT, bind});
    return {
      data: pageResult,
      limit: $limit,
      skip: $skip,
      total
    };
}

export async function executeSql( queryString:string, bind?: BindOrReplacements) : Promise<any[]>{
  let sequelize: Sequelize = app.get('sequelizeClient')
  try {
    return await sequelize.query(queryString , { bind, type: QueryTypes.SELECT});
  } catch (error) {
    console.log('==========================');
    
    throw error;
    
  }
}

export async function staticPaginate( data: any[], paginationParams: {$skip: number, $limit: number}| any ){
  let pageResult = data; //change to a limited data
  let {$skip, $limit}:any = paginationParams;
    if(!$skip) $skip=0; if(!$limit) $limit=10;

  return {
    data: pageResult,
    limit: $limit,
    skip: $skip,
    total:data.length
  };
}