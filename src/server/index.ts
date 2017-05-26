import * as express from 'express';
import * as handlebars from 'express-handlebars';
import * as path from 'path';

const app = express();
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
const static_path = path.join(__dirname, '../public');
app.use('/', express.static(static_path));

app.get('/', function(req, res) {
	res.render('home');
});

app.listen(3000);
