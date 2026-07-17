const http = require("http");
const server = http.createServer((req, res) => {
  console.log(`[Webhook Received] ${req.method} ${req.url}`);
  res.writeHead(200);
  res.end("OK");
});
server.listen(4000, () => console.log("Webhook test server listening on port 4000"));
