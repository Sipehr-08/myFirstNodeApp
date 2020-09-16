'use strict';

const http = require('http');
const mysqlx = require('@mysql/xdevapi');

const port = process.env.PORT || 9999;
const statusOk = 200;
const statusNoContent = 204;
const statusBadRequest = 400;
const statusNotFound = 404;
const statusInternalServerError = 500;
const schema = 'social';

const client = mysqlx.getClient({
  user: 'app',
  password: 'pass',
  host: '0.0.0.0',
  port: 33060
});

function sendResponse(response, {
  status = statusOk,
  headers = {},
  body = null
}) {
  Object.entries(headers).forEach(function ([key, value]) {
    response.setHeader(key, value);
  });
  response.writeHead(status);
  response.end(body);
}

function sendJSON(response, body) {
  sendResponse(response, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function map(columns) {
  return row => row.reduce((res, value, i) => ({
    ...res,
    [columns[i].getColumnLabel()]: value
  }), {});
}

const methods = new Map();

methods.set('/posts.get', async ({
  response,
  db
}) => {
  const table = await db.getTable('posts');
  const result = await table.select(['id', 'content', 'likes', 'created'])
    .orderBy('id DESC')
    .where('removed = FALSE')
    .execute();

  const data = result.fetchAll();
  const columns = result.getColumns();
  const posts = data.map(map(columns));
  sendJSON(response, posts);
});

methods.set('/posts.getById', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id') || !Number(searchParams.get('id'))) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }
  const table = await db.getTable('posts');


  const result = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = FALSE AND id = :id')
    .bind('id', id)
    .execute();
  const data = result.fetchAll();
  result.getAffectedItemsCount();
  const columns = result.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });

  if (newPost.length > 0) {
    sendJSON(response, poste[0]);
    return;
  } else {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  console.log(poste);

});

methods.set('/posts.post', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('content')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const content = searchParams.get('content');

  const table = db.getTable('posts');

  await table.insert('content')
    .values(content)
    .execute();
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .orderBy('id DESC')
    .where('removed = FALSE')
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  sendJSON(response, poste[0]);
});

methods.set('/posts.edit', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id') || !Number(searchParams.get('id'))) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  if (!searchParams.has('content')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }
  const content = searchParams.get('content');

  const table = db.getTable('posts');

  await table.update()
    .set('content', content)
    .where('removed = FALSE AND id = :id')
    .bind('id', id)
    .execute();
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = FALSE')
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });

  if (newPost.length > 0) {
    sendJSON(response, newPost[0]);
    return;
  } else {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }
});

methods.set('/posts.delete', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const table = await db.getTable('posts');
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = FALSE')
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });


  await table.update()
    .set('removed', true)
    .where('removed = FALSE AND id = :id')
    .bind('id', id)
    .execute();

  if (newPost.length > 0) {
    sendJSON(response, newPost[0]);
    return;
  } else {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }
  const removed = result.getAffectedItemsCount();

  if (removed === 0) {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  sendResponse(response, {
    status: statusNoContent
  });

});

methods.set('/posts.restore', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const table = await db.getTable('posts');
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = TRUE')
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });


  await table.update()
    .set('removed', false)
    .where('removed = TRUE AND id = :id')
    .bind('id', id)
    .execute();

  if (newPost.length > 0) {
    sendJSON(response, newPost[0]);
    return;
  } else {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }
  const removed = result.getAffectedItemsCount();

  if (removed === 0) {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  sendResponse(response, {
    status: statusNoContent
  });

});
methods.set('/posts.like', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const table = await db.getTable('posts');
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = FALSE AND id = :id')
    .bind('id', id)
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });

  //sendJSON(response, newPost[0]);


  if (newPost.length > 0) {
    let likePlus = poste[0].likes++;
    await table.update()
      .set('likes', ++likePlus)
      .where('removed = FALSE AND id = :id')
      .bind('id', id)
      .execute();
    sendJSON(response, newPost[0]);
    return;
  }
  sendResponse(response, {
    status: statusNotFound
  });
  const removed = result.getAffectedItemsCount();

  if (removed === 0) {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  sendResponse(response, {
    status: statusNoContent
  });
});
methods.set('/posts.dislike', async ({
  response,
  searchParams,
  db
}) => {
  if (!searchParams.has('id')) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const id = Number(searchParams.get('id'));
  if (Number.isNaN(id)) {
    sendResponse(response, {
      status: statusBadRequest
    });
    return;
  }

  const table = await db.getTable('posts');
  const newResult = await table.select(['id', 'content', 'likes', 'created'])
    .where('removed = FALSE AND id = :id')
    .bind('id', id)
    .execute();
  const data = newResult.fetchAll();
  const columns = newResult.getColumns();
  const poste = data.map(map(columns));
  const newPost = poste.filter((post) => {
    return post.id === id;
  });

  if (newPost.length > 0) {
    poste[0].likes--;

    await table.update()
      .set('likes', poste[0].likes)
      .where('removed = FALSE AND id = :id')
      .bind('id', id)
      .execute();

    sendJSON(response, newPost[0]);
    return;
  } else {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }
  const removed = result.getAffectedItemsCount();

  if (removed === 0) {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  sendResponse(response, {
    status: statusNoContent
  });

});

const server = http.createServer(async (request, response) => {
  const {
    pathname,
    searchParams
  } = new URL(request.url, `http://${request.headers.host}`);

  const method = methods.get(pathname);
  if (method === undefined) {
    sendResponse(response, {
      status: statusNotFound
    });
    return;
  }

  let session = null;
  try {
    session = await client.getSession();
    const db = await session.getSchema(schema);

    const params = {
      request,
      response,
      pathname,
      searchParams,
      db,
    };

    await method(params);
  } catch (e) {
    sendResponse(response, {
      status: statusInternalServerError
    });
  } finally {
    if (session !== null) {
      try {
        await session.close();
      } catch (e) {
        console.log(e);
      }
    }
  }
});

server.listen(port);