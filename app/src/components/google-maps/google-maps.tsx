import {
  Circle,
  GoogleMap,
  LoadScript,
  OverlayView,
  Polyline
} from "@react-google-maps/api"
import React, { useEffect, useState, useContext } from "react"

import PlayButton from "./play-button"
import StopButton from "./stop-button"
import MapStyles from "./map-styles"
import { AppContext } from "../context/app-context"
import { Activity } from "../../shared-interfaces"
import { API, graphqlOperation } from "aws-amplify"
import * as mutations from "../../graphql/mutations"

interface RunTracker {
  coordinates?: Position[]
  active?: boolean
  startTime?: number | null
  endTime?: number | null
}

interface Position {
  lat: number
  lng: number
}

const runPathOptions = {
  fillColor: "lightblue",
  fillOpacity: 1,
  strokeColor: "red",
  strokeOpacity: 1,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  geodesic: false,
  zIndex: 1
}

const circleOptions = {
  strokeColor: "#FE6B8B",
  strokeOpacity: 0.8,
  strokeWeight: 2,
  fillColor: "#FF8E53",
  fillOpacity: 0.8
}

const GoogleMaps = () => {
  const { contextState } = useContext(AppContext)
  const [playerPosition, setPlayerPosition] = useState(() => {
    const defaultState: Position = {
      lat: 55.672,
      lng: 12.562
    }
    return defaultState
  })

  const [runTracker, setRunTracker] = useState<RunTracker>(() => {
    const defaultState: RunTracker = {
      coordinates: [],
      active: false,
      startTime: null,
      endTime: null
    }
    return defaultState
  })

  useEffect(() => {
    console.log("Calling map useEffect")
    initiateMap()
  }, [])

  useEffect(() => {
    console.log("Calling useEffect with active: ", runTracker.active)
    navigator.geolocation.watchPosition(trackPath, errorCallback, {
      enableHighAccuracy: true
    })

    return () => {
      let id = navigator.geolocation.watchPosition(success, errorCallback)
      navigator.geolocation.clearWatch(id)
    }
  }, [runTracker.active])

  function initiateMap() {
    currentPosition()
  }

  const currentPosition = () => {
    if (!navigator.geolocation) {
      alert("geolocation is not supported in this browser")
    } else {
      navigator.geolocation.getCurrentPosition(success, errorCallback)
    }
  }

  function trackPath(position: any) {
    var latitude = position.coords.latitude
    var longitude = position.coords.longitude

    const myPosition = {
      lat: latitude,
      lng: longitude
    }

    if (runTracker.active) {
      console.log("Adding position: ", myPosition)
      var coords = runTracker.coordinates
      coords?.push(myPosition)
      console.log("Coords: ", coords)
      coords = reducePaths(coords)
      setRunTracker({ ...runTracker, coordinates: coords })
    }

    setPlayerPosition(myPosition)
  }

  function success(position: any) {
    console.log("Success")
    var latitude = position.coords.latitude
    var longitude = position.coords.longitude

    const myPosition = {
      lat: latitude,
      lng: longitude
    }

    setPlayerPosition(myPosition)
  }

  function errorCallback(error: any) {
    alert("ERROR(" + error.code + "): " + error.message)
  }

  const onPlayClicked = () => {
    console.log("Starting run")
    const today = new Date()
    const startTime = today.getHours() + today.getMinutes() + today.getSeconds()

    setRunTracker({
      ...runTracker,
      coordinates: [],
      startTime: startTime,
      active: true
    })
  }

  const onStopClicked = () => {
    console.log("Ending run")
    const today = new Date()
    const endTime = today.getHours() + today.getMinutes() + today.getSeconds()
    const date =
      today.getDay() + today.getMonth() + today.getFullYear() + endTime
    const startTime = runTracker.startTime
    console.log("Endtime and start time: ", endTime, startTime)

    const runDuration = startTime ? endTime - startTime : 0

    //const distance = calculateDistance(runCoords)
    const reducedPaths = reducePaths(runTracker.coordinates)
    const length = calculateDistance(reducedPaths)
    const calories = calculateCalories(length)
    const steps = calculateSteps(length)
    const name = `${today.getDay()}-${today.getMonth()}-${today.getFullYear()} ${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`
    console.log("run duration: ", runDuration)
    console.log("reducedPaths", reducedPaths)

    const input: Activity = {
      userID: contextState.user.id,
      name: name,
      duration: runDuration,
      length: length,
      calories: calories,
      steps: steps
    }

    API.graphql(graphqlOperation(mutations.createActivity, { input: input }))

    setRunTracker({ ...runTracker, active: false })
  }

  const calculateDistance = (paths: Position[]) => {
    var R = 6371e3 // metres
    var distance = 0
    if (paths.length > 2) {
      for (let index = 1; index < paths.length; index++) {
        const element = paths[index - 1]
        const element2 = paths[index]

        const lat1 = element.lat
        const lat2 = element2.lat
        const lon1 = element.lng
        const lon2 = element2.lng

        var φ1 = (lat1 * Math.PI) / 180
        var φ2 = (lat2 * Math.PI) / 180
        var Δφ = ((lat2 - lat1) * Math.PI) / 180
        var Δλ = ((lon2 - lon1) * Math.PI) / 180

        var a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        var d = R * c
        distance = +d
      }
    }

    return distance
  }

  const calculateCalories = (distance: number) => {
    // https://www.runnersworld.com/training/a20801301/calories-burned-running-calculator/
    // Took default number and multiplying. Don't want to deal with weight and other factors
    const calories = distance * 0.0625
    return Math.round(calories)
  }

  const calculateSteps = (distance: number) => {
    // steps calculations from https://www.quora.com/On-average-how-many-steps-does-it-take-to-travel-100-meters
    const steps = distance * 1.3
    return Math.round(steps)
  }

  const activeOverlay = (
    <OverlayView
      position={playerPosition}
      getPixelPositionOffset={() => ({
        x: 0,
        y: 150
      })}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <>
        <PlayButton onClick={onPlayClicked} />
      </>
    </OverlayView>
  )

  const pausedOverlay = (
    <OverlayView
      position={playerPosition}
      getPixelPositionOffset={() => ({
        x: 0,
        y: 150
      })}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <>
        <StopButton onClick={onStopClicked} />
      </>
    </OverlayView>
  )

  const reducePaths = (paths: Position[] | undefined) => {
    var previousPath: Position = { lat: -99999999999, lng: -9999999999999 }
    var reducedPaths: Position[] = []

    paths &&
      paths.forEach(element => {
        if (
          element.lat === previousPath.lat &&
          element.lng === previousPath.lng
        ) {
        } else {
          reducedPaths.push(element)
          previousPath = element
        }
      })

    return reducedPaths
  }

  return (
    <>
      <p>Run Coordinates: {runTracker.coordinates?.length}</p>
      <p>
        Run distance:{" "}
        {runTracker.coordinates && calculateDistance(runTracker.coordinates)}
      </p>
      {runTracker.coordinates?.map((item: Position, index: number) => {
        return <p key={index}>{item.lat}</p>
      })}
      <LoadScript
        id="script-loader"
        googleMapsApiKey="AIzaSyDEKSGDimrHDb12-2kflJkrzAcRf3MECsQ"
      >
        <GoogleMap
          id="circle-example"
          mapContainerStyle={{
            position: "absolute",
            width: "100%",
            height: "100%"
          }}
          zoom={18}
          center={playerPosition}
          options={{
            disableDefaultUI: true,
            styles: MapStyles
          }}
        >
          {runTracker.active && (
            <Polyline options={runPathOptions} path={runTracker.coordinates} />
          )}
          {runTracker.active ? pausedOverlay : activeOverlay}
          <Circle center={playerPosition} radius={4} options={circleOptions} />
        </GoogleMap>
      </LoadScript>
    </>
  )
}

export default GoogleMaps
