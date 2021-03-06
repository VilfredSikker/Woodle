import { Auth } from "aws-amplify"
import { useFormik } from "formik"
import React from "react"
import StyledButton from "../../basics/button/button"
import InputField from "../../basics/input-field/input-field"
import LoginLayout from "../../layout/login-layout/login-layout"
import { ToastsStore } from "react-toasts"
import { useHistory } from "react-router-dom"

const FormikConfirmSignUp = () => {
  const history = useHistory()
  const formik = useFormik({
    initialValues: {
      username: "",
      confirmationCode: "",
    },
    onSubmit: (values) => {
      Auth.confirmSignUp(values.username, values.confirmationCode)
        .then(() => {
          history.push("/login")
        })
        .catch((err) =>
          ToastsStore.error(
            "Make sure to use the correct username and confirmation code"
          )
        )
    },
  })
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
          name="confirmationCode"
          label="Confirmation Code"
          onChange={formik.handleChange}
          value={formik.values.confirmationCode}
        />
        <StyledButton type="submit">Sign Up Now</StyledButton>
      </form>
    </LoginLayout>
  )
}

export default FormikConfirmSignUp
