import {
  FIRST_EVER_RELATIONSHIP,
  LAST_EVER_RELATIONSHIP,
  FIRST_BEFORE_RELATIONSHIP,
  LAST_BEFORE_RELATIONSHIP,
  FIRST_IN_BETWEEN_RELATIONSHIP,
  FIRST_AFTER_RELATIONSHIP,
  LAST_IN_BETWEEN_RELATIONSHIP,
  AGG_ALL_IN_BETWEEN_RELATIONSHIP,
  AGG_ALL_EVER_RELATIONSHIP,
  AGG_ALL_BEFORE_RELATIONSHIP,
  AGG_ALL_AFTER_RELATIONSHIP,
} from 'util/datasets'
import { IRelationshipConstants } from '../interfaces'

import first_ever__all from './first_ever__all'
import first_ever__first from './first_ever__first'
import first_ever__last from './first_ever__last'
import first_ever__all_same from './first_ever__all_same'
import first_ever__first_same from './first_ever__first_same'
import first_ever__last_same from './first_ever__last_same'

import last_ever__all from './last_ever__all'
import last_ever__first from './last_ever__first'
import last_ever__last from './last_ever__last'
import last_ever__all_same from './last_ever__all_same'
import last_ever__first_same from './last_ever__first_same'
import last_ever__last_same from './last_ever__last_same'

import first_in_between__all from './first_in_between__all'
import first_in_between__first from './first_in_between__first'
import first_in_between__last from './first_in_between__last'
import first_in_between__all_same from './first_in_between__all_same'
import first_in_between__first_same from './first_in_between__first_same'
import first_in_between__last_same from './first_in_between__last_same'

import first_after__all from './first_after__all'
import first_after__first from './first_after__first'
import first_after__last from './first_after__last'
import first_after__all_same from './first_after__all_same'
import first_after__first_same from './first_after__first_same'
import first_after__last_same from './first_after__last_same'

import last_in_between__all from './last_in_between__all'
import last_in_between__first from './last_in_between__first'
import last_in_between__last from './last_in_between__last'
import last_in_between__all_same from './last_in_between__all_same'
import last_in_between__first_same from './last_in_between__first_same'
import last_in_between__last_same from './last_in_between__last_same'

import first_before__all from './first_before__all'
import first_before__first from './first_before__first'
import first_before__last from './first_before__last'
import first_before__all_same from './first_before__all_same'
import first_before__first_same from './first_before__first_same'
import first_before__last_same from './first_before__last_same'

import last_before__all from './last_before__all'
import last_before__first from './last_before__first'
import last_before__last from './last_before__last'
import last_before__all_same from './last_before__all_same'
import last_before__first_same from './last_before__first_same'
import last_before__last_same from './last_before__last_same'

import agg_all_ever__all from './agg_all_ever__all'
import agg_all_ever__first from './agg_all_ever__first'
import agg_all_ever__last from './agg_all_ever__last'
import agg_all_ever__all_same from './agg_all_ever__all_same'
import agg_all_ever__first_same from './agg_all_ever__first_same'
import agg_all_ever__last_same from './agg_all_ever__last_same'

import agg_all_in_between__all from './agg_all_in_between__all'
import agg_all_in_between__first from './agg_all_in_between__first'
import agg_all_in_between__last from './agg_all_in_between__last'
import agg_all_in_between__all_same from './agg_all_in_between__all_same'
import agg_all_in_between__first_same from './agg_all_in_between__first_same'
import agg_all_in_between__last_same from './agg_all_in_between__last_same'

import agg_all_before__all from './agg_all_before__all'
import agg_all_before__first from './agg_all_before__first'
import agg_all_before__last from './agg_all_before__last'
import agg_all_before__all_same from './agg_all_before__all_same'
import agg_all_before__first_same from './agg_all_before__first_same'
import agg_all_before__last_same from './agg_all_before__last_same'

import agg_all_after__all from './agg_all_after__all'
import agg_all_after__first from './agg_all_after__first'
import agg_all_after__last from './agg_all_after__last'
import agg_all_after__all_same from './agg_all_after__all_same'
import agg_all_after__first_same from './agg_all_after__first_same'
import agg_all_after__last_same from './agg_all_after__last_same'

export default {
  [FIRST_EVER_RELATIONSHIP]: {
    all: { default: first_ever__all, same: first_ever__all_same },
    first: { default: first_ever__first, same: first_ever__first_same },
    last: { default: first_ever__last, same: first_ever__last_same },
    custom: { default: first_ever__all, same: first_ever__all_same },
  },
  [LAST_EVER_RELATIONSHIP]: {
    all: { default: last_ever__all, same: last_ever__all_same },
    first: { default: last_ever__first, same: last_ever__first_same },
    last: { default: last_ever__last, same: last_ever__last_same },
    custom: { default: last_ever__all, same: last_ever__all_same },
  },
  [FIRST_BEFORE_RELATIONSHIP]: {
    all: { default: first_before__all, same: first_before__all_same },
    first: { default: first_before__first, same: first_before__first_same },
    last: { default: first_before__last, same: first_before__last_same },
    custom: { default: first_before__all, same: first_before__all_same },
  },
  [LAST_BEFORE_RELATIONSHIP]: {
    all: { default: last_before__all, same: last_before__all_same },
    first: { default: last_before__first, same: last_before__first_same },
    last: { default: last_before__last, same: last_before__last_same },
    custom: { default: last_before__all, same: last_before__all_same },
  },
  [FIRST_IN_BETWEEN_RELATIONSHIP]: {
    all: { default: first_in_between__all, same: first_in_between__all_same },
    first: { default: first_in_between__first, same: first_in_between__first_same },
    last: { default: first_in_between__last, same: first_in_between__last_same },
    custom: { default: first_in_between__all, same: first_in_between__all_same },
  },
  [FIRST_AFTER_RELATIONSHIP]: {
    all: { default: first_after__all, same: first_after__all_same },
    first: { default: first_after__first, same: first_after__first_same },
    last: { default: first_after__last, same: first_after__last_same },
    custom: { default: first_after__all, same: first_after__all_same },
  },
  [LAST_IN_BETWEEN_RELATIONSHIP]: {
    all: { default: last_in_between__all, same: last_in_between__all_same },
    first: { default: last_in_between__first, same: last_in_between__first_same },
    last: { default: last_in_between__last, same: last_in_between__last_same },
    custom: { default: last_in_between__all, same: last_in_between__all_same },
  },
  [AGG_ALL_IN_BETWEEN_RELATIONSHIP]: {
    all: { default: agg_all_in_between__all, same: agg_all_in_between__all_same },
    first: { default: agg_all_in_between__first, same: agg_all_in_between__first_same },
    last: { default: agg_all_in_between__last, same: agg_all_in_between__last_same },
    custom: { default: agg_all_in_between__all, same: agg_all_in_between__all_same },
  },
  [AGG_ALL_EVER_RELATIONSHIP]: {
    all: { default: agg_all_ever__all, same: agg_all_ever__all_same },
    first: { default: agg_all_ever__first, same: agg_all_ever__first_same },
    last: { default: agg_all_ever__last, same: agg_all_ever__last_same },
    custom: { default: agg_all_ever__all, same: agg_all_ever__all_same },
  },
  [AGG_ALL_BEFORE_RELATIONSHIP]: {
    all: { default: agg_all_before__all, same: agg_all_before__all_same },
    first: { default: agg_all_before__first, same: agg_all_before__first_same },
    last: { default: agg_all_before__last, same: agg_all_before__last_same },
    custom: { default: agg_all_before__all, same: agg_all_before__all_same },
  },
  [AGG_ALL_AFTER_RELATIONSHIP]: {
    all: { default: agg_all_after__all, same: agg_all_after__all_same },
    first: { default: agg_all_after__first, same: agg_all_after__first_same },
    last: { default: agg_all_after__last, same: agg_all_after__last_same },
    custom: { default: agg_all_after__all, same: agg_all_after__all_same },
  },
} as {
  [key: string]: {
    all: { default: IRelationshipConstants; same: IRelationshipConstants }
    first: { default: IRelationshipConstants; same: IRelationshipConstants }
    last: { default: IRelationshipConstants; same: IRelationshipConstants }
    custom: { default: IRelationshipConstants; same: IRelationshipConstants }
  }
}
