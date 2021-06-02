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
import CylcBeef from '@/components/cylc/beef/cylc-beef'
import {
  containsBeefData,
  createWorkflowNode,
  createCyclePointNode,
  createFamilyProxyNode,
  createTaskProxyNode,
  createJobNode
} from '@/components/cylc/beef/beef-nodes'

/**
 * Populate the given beef using the also provided GraphQL workflow object.
 *
 * Every node has data, and a .name property used to display the node in the
 * beef in the UI.
 *
 * @param beef {null|CylcBeef} - A hierarchical beef
 * @param workflow {null|Object} - GraphQL workflow object
 * @throws {Error} - If the workflow or beef are either null or invalid (e.g. missing data)
 */
function populateBeefFromGraphQLData (beef, workflow) {
  if (!beef || !workflow || !containsBeefData(workflow)) {
    // throw new Error('You must provide valid data to populate the beef!')
    // a stopped workflow is valid, but won't have anything that we can use
    // to populate the beef, only workflow data and empty families
    return
  }
  // the workflow object gets augmented to become a valid node for the beef
  const rootNode = createWorkflowNode(workflow)
  beef.setWorkflow(rootNode)
  for (const cyclePoint of workflow.cyclePoints) {
    const cyclePointNode = createCyclePointNode(cyclePoint)
    beef.addCyclePoint(cyclePointNode)
  }
  for (const familyProxy of workflow.familyProxies) {
    const familyProxyNode = createFamilyProxyNode(familyProxy)
    beef.addFamilyProxy(familyProxyNode)
  }
  for (const taskProxy of workflow.taskProxies) {
    const taskProxyNode = createTaskProxyNode(taskProxy)
    beef.addTaskProxy(taskProxyNode)
    // A TaskProxy could no jobs (yet)
    if (taskProxy.jobs) {
      for (const job of taskProxy.jobs) {
        const jobNode = createJobNode(job)
        beef.addJob(jobNode)
      }
    }
  }
}

export {
  populateBeefFromGraphQLData
}
