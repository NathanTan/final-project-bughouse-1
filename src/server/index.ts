import * as express from 'express';
import * as handlebars from 'express-handlebars';

const app = express();
app.engine('handlebars', handlebars({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.get('/', function(req, res) {
	res.render('home');
});

app.listen(3000);
