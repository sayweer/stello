import deployment from "../../deployments/testnet.json";
import example from "../../deployments/example.json";
export { deployment, example };

/** Where the example app runs. Its own repository: github.com/sayweer/stello-kampanya */
export const exampleUrl = "https://stello-core-et2a.vercel.app";

/** Where this site is published. The fallback for anything that has no request to read a host from. */
export const siteUrl = "https://stello-web-rho.vercel.app";
