export interface User {
  id: string
  username: string
  friends: User[] | null
  activities: Activity[] | null
}

export interface Activity {
  userID: string
  id: string
  name: string
  length?: number
  duration?: number
  calories?: number
  steps?: number
  type?: ActivityType
  path?: Coordinate[]
}

export interface Friend {
  id: string
  friendID: string
  friendName: string
  activities: Activity[]
}

export interface FriendConnector {
  friendID: string
  connectorID: string
}

export interface Coordinate {
  lat: number
  lng: number
}

export enum ActivityType {
  SOLO,
  GROUP,
  SPONSORED,
}
