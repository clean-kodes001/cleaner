export const validatePasswordStrength = (
  password,
  confirmPassword,
  passwordStrength,
) => {
  const allFoundCharacters =
    password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g)?.length || 0;
  const allFoundNumericCharacters = password.match(/[0-9]/g)?.length || 0;
  const allFoundUppercaseCharacters = password.match(/[A-Z]/g)?.length || 0;
  const allFoundLowercaseCharacters = password.match(/[a-z]/g)?.length || 0;

  const updatedStrength = passwordStrength.map(item => {
    switch (item.id) {
      case 1:
        return {
          ...item,
          passed: password.length >= 8 ? true : false,
        };

      case 2:
        return {
          ...item,
          passed: allFoundUppercaseCharacters ? true : false,
        };
      case 3:
        return {
          ...item,
          passed: allFoundCharacters ? true : false,
        };
      case 4:
        return {
          ...item,
          passed: allFoundLowercaseCharacters ? true : false,
        };
      case 5:
        return {
          ...item,
          passed: allFoundNumericCharacters ? true : false,
        };
      //   case 4:
      //     return {
      //       ...item,
      //       passed: password === confirmPassword ? true : false,
      //     };
      default:
        return {...item};
    }
  });
  return updatedStrength;
};

//   export const validateConfirmPassword = (
//     password,
//     confirmPassword,
//     passwordStrength
//   ) => {
//     const updatedStrength = passwordStrength.map((item) => {
//       switch (item.id) {
//         case 4:
//           return {
//             ...item,
//             passed: password === confirmPassword ? true : false,
//           };
//         default:
//           return { ...item };
//       }
//     });
//     return updatedStrength;
//   };

export const submitValidations = (passwordStrength, form) => {
  let err = 0;

  if (passwordStrength.some(x => x.passed !== true)) {
    form.setErrors({
      password: passwordStrength.find(item => item.passed !== true).title,
    });
    err = true;
  }
  return err;
};
