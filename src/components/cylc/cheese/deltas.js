/**
 * Copyright (C) NIWA & British Crown (Met Office) & Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  createCyclePointNode,
  createFamilyProxyNode,
  createJobNode,
  createTaskProxyNode
} from '@/components/cylc/cheese/cheese-nodes'
import { populateCheeseFromGraphQLData } from '@/components/cylc/cheese/index'
import store from '@/store/'
import AlertModel from '@/model/Alert.model'

/**
 * Helper object used to iterate pruned deltas data.
 */
const PRUNED = {
  jobs: 'removeJob',
  taskProxies: 'removeTaskProxy',
  familyProxies: 'removeFamilyProxy'
}

/**
 * @typedef {Object} DeltasPruned
 * @property {Array<string>} taskProxies - IDs of task proxies removed
 * @property {Array<string>} familyProxies - IDs of family proxies removed
 * @property {Array<string>} jobs - IDs of jobs removed
 */

/**
 * Deltas pruned.
 *
 * @param {DeltasPruned} pruned - deltas pruned
 * @param {CylcCheese} cheese
 */
function applyDeltasPruned (pruned, cheese) {
  Object.keys(PRUNED).forEach(prunedKey => {
    if (pruned[prunedKey]) {
      for (const id of pruned[prunedKey]) {
        try {
          cheese[PRUNED[prunedKey]](id)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying pruned-delta, will continue processing the remaining data', error, id)
          store.dispatch('setAlert', new AlertModel('Error applying pruned-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      }
    }
  })
}

/**
 * Helper object used to iterate added deltas data.
 */
const ADDED = {
  cyclePoints: [createCyclePointNode, 'addCyclePoint'],
  familyProxies: [createFamilyProxyNode, 'addFamilyProxy'],
  taskProxies: [createTaskProxyNode, 'addTaskProxy'],
  jobs: [createJobNode, 'addJob']
}

/**
 * @typedef {Object} DeltasAdded
 * @property {Object} workflow
 * @property {Array<Object>} cyclePoints
 * @property {Array<Object>} familyProxies
 * @property {Array<Object>} taskProxies
 * @property {Array<Object>} jobs
 */

/**
 * Deltas added.
 *
 * @param {DeltasAdded} added
 * @param {CylcCheese} cheese
 */
function applyDeltasAdded (added, cheese) {
  Object.keys(ADDED).forEach(addedKey => {
    if (added[addedKey]) {
      added[addedKey].forEach(addedData => {
        try {
          const createNodeFunction = ADDED[addedKey][0]
          const cheeseFunction = ADDED[addedKey][1]
          const node = createNodeFunction(addedData)
          cheese[cheeseFunction](node)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying added-delta, will continue processing the remaining data', error, addedData)
          store.dispatch('setAlert', new AlertModel('Error applying added-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      })
    }
  })
}

/**
 * Helper object used to iterate updated deltas data.
 */
const UPDATED = {
  familyProxies: [createFamilyProxyNode, 'updateFamilyProxy'],
  taskProxies: [createTaskProxyNode, 'updateTaskProxy'],
  jobs: [createJobNode, 'updateJob']
}

/**
 * @typedef {Object} DeltasUpdated
 * @property {Array<Object>} familyProxies
 * @property {Array<Object>} taskProxies
 * @property {Array<Object>} jobs
 */

/**
 * Deltas updated.
 *
 * @param updated {DeltasUpdated} updated
 * @param {CylcCheese} cheese
 */
function applyDeltasUpdated (updated, cheese) {
  Object.keys(UPDATED).forEach(updatedKey => {
    if (updated[updatedKey]) {
      updated[updatedKey].forEach(updatedData => {
        try {
          const updateNodeFunction = UPDATED[updatedKey][0]
          const cheeseFunction = UPDATED[updatedKey][1]
          const node = updateNodeFunction(updatedData)
          cheese[cheeseFunction](node)
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error applying updated-delta, will continue processing the remaining data', error, updatedData)
          store.dispatch('setAlert', new AlertModel('Error applying updated-delta, see browser console logs for more. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        }
      })
    }
  })
}

/**
 * @typedef {Object} Deltas
 * @property {string} id
 * @property {boolean} shutdown
 * @property {?DeltasAdded} added
 * @property {?DeltasUpdated} updated
 * @property {?DeltasPruned} pruned
 */

/**
 * Handle the initial data burst of deltas. Should create a cheese given a workflow from the GraphQL
 * data. This cheese contains the base structure to which the deltas are applied to.
 *
 * @param {Deltas} deltas - GraphQL deltas
 * @param {CylcCheese} cheese - Cheese object backed by an array and a Map
 */
function handleInitialDataBurst (deltas, cheese) {
  const workflow = deltas.added.workflow
  // A workflow (e.g. five) may not have any families as 'root' is filtered
  workflow.familyProxies = workflow.familyProxies || []
  populateCheeseFromGraphQLData(cheese, workflow)
  cheese.tallyCyclePointStates()
}

/**
 * Handle the deltas. This function receives the new set of deltas, and the cheese object. It is assumed
 * the cheese has been correctly created. Except for family proxies, it is expected that other elements
 * are only created via the deltas.added attribute.
 *
 * Family proxies are a special case, due to hierarchy within families, so we have no easy way to grab
 * the first family from the top of the hierarchy in the deltas.
 *l
 * @param {Deltas} deltas - GraphQL deltas
 * @param {CylcCheese} cheese - Cheese object backed by an array and a Map
 */
function handleDeltas (deltas, cheese) {
  if (deltas.pruned) {
    applyDeltasPruned(deltas.pruned, cheese)
  }
  if (deltas.added) {
    applyDeltasAdded(deltas.added, cheese)
  }
  if (deltas.updated) {
    applyDeltasUpdated(deltas.updated, cheese)
  }
  // if added, removed, or updated deltas, we want to re-calculate the cycle point states now
  if (deltas.pruned || deltas.added || deltas.updated) {
    cheese.tallyCyclePointStates()
  }
}

/**
 * @param {?Deltas} deltas
 * @param {?CylcCheese} cheese
 */
export function applyCheeseDeltas (deltas, cheese) {
  if (deltas && cheese) {
    // first we check whether it is a shutdown response
    if (deltas.shutdown) {
      cheese.clear()
      return
    }
    if (cheese.isEmpty()) {
      // When the cheese is null, we have two possible scenarios:
      //   1. This means that we will receive our initial data burst in deltas.added.workflow
      //      which we can use to create the cheese structure.
      //   2. Or this means that after the shutdown (when we delete the cheese), we received a delta.
      //      In this case we don't really have any way to fix the cheese.
      // In both cases, actually, the user has little that s/he could do, besides refreshing the
      // page. So we fail silently and wait for a request with the initial data.
      if (!deltas.added || !deltas.added.workflow) {
        // eslint-disable-next-line no-console
        console.error('Received a delta before the workflow initial data burst')
        store.dispatch('setAlert', new AlertModel('Received a delta before the workflow initial data burst. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        return
      }
      try {
        handleInitialDataBurst(deltas, cheese)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error applying initial data burst for deltas', error, deltas)
        store.dispatch('setAlert', new AlertModel('Error applying initial data burst for deltas. Please reload your browser tab to retrieve the full flow state', null, 'error'))
        throw error
      }
    } else {
      // the cheese was created, and now the next messages should contain
      // 1. new data added under deltas.added (but not in deltas.added.workflow)
      // 2. data updated in deltas.updated
      // 3. data pruned in deltas.pruned
      try {
        handleDeltas(deltas, cheese)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error applying deltas', error, deltas)
        throw error
      }
    }
  } else {
    throw Error('Workflow cheese subscription did not return data.deltas')
  }
}
