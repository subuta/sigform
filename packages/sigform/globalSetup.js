export default () => {
  // SEE: [reactjs - How do I set a timezone in my Jest config? - Stack Overflow](https://stackoverflow.com/questions/56261381/how-do-i-set-a-timezone-in-my-jest-config)
  process.env.TZ = "UTC";
};
