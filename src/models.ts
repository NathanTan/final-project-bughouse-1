
interface Piece {
	color: "black" | "white";
	type: "pawn" | "knight" | "bishop" | "rook" | "king" | "queen";
	promoted: boolean;
}

var myPiece = {
	color: "black",
	type: "queen",
	promoted: true
};
