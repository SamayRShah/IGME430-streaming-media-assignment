const fs = require('fs');
const path = require('path'); // allows to create file object from path

const loadFile = (request, response, dir, mType) => {
  const file = path.resolve(__dirname, dir);

  // provides statistics about file
  fs.stat(file, (err, stats) => {
    // if error, send error code, use 404 for file not found (ERROR NO ENTRY)
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    // get range from requess headers
    let { range } = request.headers;

    // if no range, start playback from beginning (0)
    if (!range) {
      range = 'bytes=0-';
    }

    // get rid of bytes title and split dash into start and end
    const positions = range.replace(/bytes=/, '').split('-');

    // Parse start position to int base [10]
    let start = parseInt(positions[0], 10);

    const total = stats.size; // file size in bytes

    // if no end position, set it to end of file
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

    // if start is greater than end, reset start range to end -1
    if (start > end) {
      start = end - 1;
    }

    // how many bytes to send
    const chunksize = (end - start) + 1;

    // send 206 - success partial content
    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mType,
    });

    // take a File object, start and end points in bytes. This only loads the amount of data needed
    const stream = fs.createReadStream(file, { start, end });

    stream.on('open', () => {
      stream.pipe(response); // sets output of stream into another stream
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr); // tells browser to stop listening for bytes
    });

    return stream;
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports = { getParty, getBling, getBird };
