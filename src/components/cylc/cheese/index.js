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

// eslint-disable-next-line no-unused-vars
import CylcCheese from '@/components/cylc/cheese/cylc-cheese'
import {
  containsCheeseData,
  createWorkflowNode,
  createCyclePointNode,
  createFamilyProxyNode,
  createTaskProxyNode,
  createJobNode
} from '@/components/cylc/cheese/cheese-nodes'

/**
 * Populate the given cheese using the also provided GraphQL workflow object.
 *
 * Every node has data, and a .name property used to display the node in the cheese in the UI.
 *
 * @param cheese {null|CylcCheese} - A hierarchical cheese
 * @param workflow {null|Object} - GraphQL workflow object
 * @throws {Error} - If the workflow or cheese are either null or invalid (e.g. missing data)
 */
function populateCheeseFromGraphQLData (cheese, workflow) {
  if (!cheese || !workflow || !containsCheeseData(workflow)) {
    // throw new Error('You must provide valid data to populate the cheese!')
    // a stopped workflow is valid, but won't have anything that we can use
    // to populate the cheese, only workflow data and empty families
    return
  }
  // the workflow object gets augmented to become a valid node for the cheese
  const rootNode = createWorkflowNode(workflow)
  cheese.setWorkflow(rootNode)
  for (const cyclePoint of workflow.cyclePoints) {
    const cyclePointNode = createCyclePointNode(cyclePoint)
    cheese.addCyclePoint(cyclePointNode)
  }
  for (const familyProxy of workflow.familyProxies) {
    const familyProxyNode = createFamilyProxyNode(familyProxy)
    cheese.addFamilyProxy(familyProxyNode)
  }
  for (const taskProxy of workflow.taskProxies) {
    const taskProxyNode = createTaskProxyNode(taskProxy)
    cheese.addTaskProxy(taskProxyNode)
    // A TaskProxy could no jobs (yet)
    if (taskProxy.jobs) {
      for (const job of taskProxy.jobs) {
        const jobNode = createJobNode(job)
        cheese.addJob(jobNode)
      }
    }
  }
}

export {
  populateCheeseFromGraphQLData
}
