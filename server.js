const express = require ('express');
const path = require('path');
const PORT = 3000;
const app = express();

app.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

app.use(express.static('../d3sample'));
app.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
});