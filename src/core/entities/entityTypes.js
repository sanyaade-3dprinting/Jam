import Rx from 'rx'
let fromEvent = Rx.Observable.fromEvent
let Observable = Rx.Observable
let merge = Rx.Observable.merge

import logger from 'log-minim'
let log = logger("app")
log.setLevel("debug")

import {generateUUID} from '../../utils/utils'
import {nameCleanup} from '../../utils/formatters'
import {computeBoundingBox,computeBoundingSphere} from 'glView-helpers/src/meshTools/computeBounds'
import {makeModelNoHistory} from '../../utils/modelUtils'


function typeUidFromMeshName(meshNameToPartTypeUId, meshName){
  return meshNameToPartTypeUId[ meshName ]
}

function typeFromMeshData(data, typeUidFromMeshName){
  let meshName      = data.resource.name || ""
  let cleanedName   = nameCleanup(meshName)

  let id = typeUidFromMeshName(meshName)
  let templateMesh = undefined

  //no id was given, it means we have a mesh with no entity (yet !)
  if( !id ) {
    id = generateUUID()

    //extract usefull information
    //we do not return the shape since that becomes the "reference shape/mesh", not the
    //one that will be shown
    templateMesh = data.mesh
    computeBoundingSphere(templateMesh)
    computeBoundingBox(templateMesh)
  }

  return {id, name:cleanedName, meshName, templateMesh } 
}

function updateTypesData(newTypeData, currentData){
  //save new data
  let regData = currentData
  let {id, name, meshName,templateMesh} = newTypeData
  
  let typeData              = regData.typeData || {}
  let meshNameToPartTypeUId = regData.meshNameToPartTypeUId || {}
  let typeUidToMeshName     = regData.typeUidToMeshName || {}
  let typeUidToTemplateMesh = regData.typeUidToTemplateMesh || {}

  if(id && meshName && templateMesh){
    typeUidToMeshName[id]      = meshName
    typeUidToTemplateMesh[id]  = templateMesh
    meshNameToPartTypeUId[meshName] = id

    typeData[id]={
        id
      ,name
    }
  }

  return {
    meshNameToPartTypeUId,
    typeUidToMeshName, 
    typeUidToTemplateMesh,

    typeData
  }
}

/////////////////
//actual api functions 

function registerTypeFromMesh(state,input){
  //log.info("I would register something", state, input)
  //console.log("I would register something", state, input)

  //prepare lookup function for finding already registered meshes
  let typeUidLookup = typeUidFromMeshName.bind(null,state.meshNameToPartTypeUId)
  //create new data
  let newData = typeFromMeshData(input,typeUidLookup)
  //update data
  return updateTypesData(newData,state)
}

function clearTypes(state, input){
  //log.info("New design, clearing registry",regData)
  return Object.assign({},defaults)
}

function entityTypes(actions, source){
  const defaults = {
    meshNameToPartTypeUId:{},
    typeUidToMeshName:{},
    typeData:{},
    
    //not sure
    typeUidToTemplateMesh:{}
  }

  let updateFns  = {registerTypeFromMesh, clearTypes}
  return makeModelNoHistory(defaults, updateFns, actions)
}

export default entityTypes