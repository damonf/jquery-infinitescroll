var express = require('express'),
    app = express();

app.set('view engine', 'jade');
app.set('view options', { layout: false });
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

app.get('/', function(req, res) {
  console.log('route - index');
  res.render('index', { title: 'infinite scroll' });
});
app.post('/fetchrows', function(req, res) {
  console.log('route - fetchrows');
  console.log(req.body);

  var rowData = [
    { description: 'bob', number: 0 },
    { description: 'bill', number: 1 },
    { description: 'billy', number: 2 },
    { description: 'barry', number: 3 },
    { description: 'robert', number: 4 },
    { description: 'harry', number: 5 },
    { description: 'jill', number: 6 },
    { description: 'betty', number: 7 },
    { description: 'jack', number: 8 },
    { description: 'adam', number: 9 },
    { description: 'nick', number: 10 },
    { description: 'nicky', number: 11 },
    { description: 'nickola', number: 12 }
  ];

  var rowIndex = req.body.rowIndex;
  var pageSize = 5;

  var filtered = [];
  rowData.forEach(function(row) {
    var searchText = req.body.searchText;
    if (!searchText || row.description.indexOf(searchText) !== -1)
      filtered.push(row);
  });

  var rows = filtered.slice(rowIndex, rowIndex + pageSize);
  console.log('sending rows...');
  console.log(rows);
  res.send(rows);
});

app.listen(3000);
console.log('Listening on port 3000');
