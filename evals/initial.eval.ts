import { evalite } from "evalite";
import { Levenshtein } from "autoevals";

evalite("My Eval", {
	data: async () => {
		return [{ input: "Hello", expected: "Hello World!" }];
	},
	task: async (input) => {
		return input + " World!";
	},
	scorers: [Levenshtein],
});