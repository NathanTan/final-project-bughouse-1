import * as express from 'express';
import * as handlebars from 'express-handlebars';
import * as path from 'path';

const app = express();

app.engine('handlebars', handlebars({
	defaultLayout: 'main',
}));
app.set('view engine', 'handlebars');

app.use('/', express.static('./public'));
app.use('/lib', express.static('./node_modules'));

app.get('/', function(req, res) {
	res.render('home');
});

app.listen(3000);
