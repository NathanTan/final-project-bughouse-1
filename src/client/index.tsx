
interface State {
	count: number;
	data: string;
}

class App {
	sock: SocketIOClient.Socket;
	state = {
		count: 0,
		data: ''
	};

	constructor(private rootElem: HTMLElement) {
		this.sock = io();
		this.sock.on('eh', this.onEh);
	}

	onEh = (data: any) => {
		const newState = {...this.state};
		newState.count++;
		newState.data = data.foo;
		this.state = newState;
		this.render();
	};

	render() {
		ReactDOM.render(
			<div>
				<p>I have eh'd {this.state.count} times.</p>
				<p>Here is my data: {this.state.data}</p>
			</div>, this.rootElem);
	}
}

const elem = document.getElementById('root')!;
const app = new App(elem);
