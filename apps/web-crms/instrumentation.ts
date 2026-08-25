export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const fs = await import("fs");
    const { execSync } = await import("child_process");
    const { setGlobalDispatcher, Agent } = await import("undici");

    const caRoot = execSync("mkcert -CAROOT").toString().trim();
    const caCertPath = `${caRoot}/rootCA.pem`;
    const ca = fs.readFileSync(caCertPath);

    setGlobalDispatcher(
      new Agent({
        connect: {
          ca,
        },
      }),
    );

    console.log(
      "[instrumentation] Registered mkcert CA for outbound fetch requests",
    );
  }
}
