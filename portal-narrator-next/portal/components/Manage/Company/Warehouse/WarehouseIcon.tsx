import Image, { StaticImageData } from 'next/image'
import { WarehouseTypes } from 'portal/stores/settings'
import React, { ImgHTMLAttributes } from 'react'
import athena from 'static/img/athena.png'
import bigquery from 'static/img/bigquery.png'
import clickhouse from 'static/img/clickhouse.png'
import databricks from 'static/img/databricks.png'
import druid from 'static/img/druid.png'
import mssql_odbc from 'static/img/mssql_odbc.png'
import mysql from 'static/img/mysql.png'
import pg from 'static/img/pg.png'
import redshift from 'static/img/redshift.png'
import snowflake from 'static/img/snowflake.png'

const icons = {
  athena,
  bigquery,
  clickhouse,
  databricks,
  druid,
  mssql_odbc,
  mysql,
  pg,
  redshift,
  snowflake,
  results: undefined,
}

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  warehouseType?: WarehouseTypes
  small?: boolean
}

const WarehouseIcon = ({ warehouseType, small = false, ...props }: Props) => {
  if (!warehouseType || !icons[warehouseType]) {
    return null
  }

  const srcWidth = small ? 32 : props.width || icons[warehouseType]?.width
  const srcHeight = small ? 32 : props.height || icons[warehouseType]?.height
  const width = srcWidth ? parseInt(srcWidth.toString()) : undefined
  const height = srcHeight ? parseInt(srcHeight.toString()) : undefined

  return (
    <Image
      {...props}
      placeholder={undefined}
      src={icons[warehouseType] as StaticImageData}
      alt={warehouseType}
      width={width}
      height={height}
      data-public
    />
  )
}

export default WarehouseIcon
