import { API, Auth, graphqlOperation } from "aws-amplify"
import { useFormik } from "formik"
import React, { useContext } from "react"
import * as mutations from "../../../graphql/mutations"
import * as queries from "../../../graphql/queries"
import { saveJwtTokenToStorage } from "../../../utils/auth"
import StyledButton from "../../basics/button/button"
import InputField from "../../basics/input-field/input-field"
import { AppContext } from "../../context/app-context"
import LoginLayout from "../../layout/login-layout/login-layout"
import { ToastsStore } from "react-toasts"
import { useHistory } from "react-router-dom"

const FormikSignIn = () => {
  const history = useHistory()
  const { setContextState } = useContext(AppContext)

  const formik = useFormik({
    initialValues: {
      username: "",
      password: "",
    },
    onSubmit: (values) => {
      Auth.signIn({
        username: values.username,
        password: values.password,
      })
        .then(() => {
          return addUserToDB(values.username)
        })
        .then(() => {
          return saveJwtOnLogin()
        })
        .then(() => {
          history.push("/app/map")
        })
        .catch(() => ToastsStore.error("Error with sign in, try again"))
    },
  })

  async function addUserToDB(username: string) {
    const filter = {
      username: {
        eq: username,
      },
    }

    await API.graphql(graphqlOperation(queries.listUsers, { filter: filter }))
      .then((result: any) => {
        let items = result.data.listUsers.items

        // username is a unique name, which is why this is safe
        if (items.length > 0) {
          let user = items[0]
          setContextState({ user: user })
        } else {
          const input = {
            username: username,
          }

          API.graphql(graphqlOperation(mutations.createUser, { input: input }))
            .then((result: any) => {
              let newUser = result.data.createUser
              setContextState({ user: newUser })

              const createFriendInput = {
                id: newUser.id,
                friendName: newUser.username,
              }
              API.graphql(
                graphqlOperation(mutations.createFriend, {
                  input: createFriendInput,
                })
              )
            })
            .catch(() => ToastsStore.error("Couldn't create user"))
        }
      })
      .catch(() => {
        ToastsStore.error("Couldn't login")
        history.push("/login")
      })
  }

  async function saveJwtOnLogin() {
    await Auth.currentSession()
      .then((data) => {
        let accessToken = data.getAccessToken()
        let jwt: string = accessToken.getJwtToken()

        setContextState({ jwtToken: jwt })

        saveJwtTokenToStorage(jwt)
      })
      .catch((err) => ToastsStore.error("Please login again"))
  }
  return (
    <LoginLayout>
      <form onSubmit={formik.handleSubmit}>
        <InputField
          name="username"
          label="Username"
          onChange={formik.handleChange}
          value={formik.values.username}
        />
        <InputField
          type="password"
          name="password"
          label="Password"
          onChange={formik.handleChange}
          value={formik.values.password}
        />
        <StyledButton type="submit" children={"Sign In"}></StyledButton>
      </form>
    </LoginLayout>
  )
}

export default FormikSignIn
