import { createAndInitializefeedback } from './utilities';

function showScore(score, bar){
	const animate = {
		from: {color: '#e80909'},
		to: {color: '#1bef00'}
	}
	if(typeof score === 'number'){
		if(score <= 0.4){
			animate.to.color = '#e80909';
		}else if(score <= 0.6){
			animate.to.color = '#ef8700';
		}else if(score <= 0.85){
			animate.to.color = '#e3ef00';
		}
		bar.set(0);
		bar.animate(score, animate);
	}else{
		throw "Attribute of result must be a number." 
	}
};

function showResult(result, type, feedback){
	if(type === 'orientation'){
		showScore(result.orientation, feedback.orientationBar);
	}else if(type === 'position'){
		showScore(result.position, feedback.positionBar);
	}else{
		throw "Argument type must be either 'orientation' or 'position'."
	}
}

export class Judge {
    constructor(Pitch, Tilt, Rotate, X, Y){
        this.feedback = createAndInitializefeedback();

		// Assumes we have the following divs already initialized in the document
		this.res = document.getElementById('result');
		this.resBtn = document.getElementById('resultButtons');
		this.gui = document.getElementById('gui');


        this.correctPitch = Pitch; 
        this.correctTilt = Tilt;
        this.correctRotate = Rotate;
        this.correctX = X, this.correctY = Y;
        this.pSigma = 140;
        this.aSigma = Math.PI/2;

    }

    score(Pitch, Tilt, Rotate, X, Y){
		const scoreO = Math.exp(-0.5*(((Pitch)/(0.08*this.aSigma))**2 + ((Tilt)/(0.4*this.aSigma))**2 + ((Rotate)/(0.4*this.aSigma))**2)), 
			  scoreP = Math.exp(-0.5*(((X - this.correctX)/(0.2*this.pSigma))**2 + ((Y - this.correctY)/(0.2*this.pSigma))**2));

		return {orientation: scoreO, position: scoreP};
    }

    showFeedback(param, pitch = 0, tilt = 0, rotate = 0, x_0 = 0, y_0 = 0){
		if(param === true){
			this.res.className = 'show';
			this.resBtn.className = 'show';
			this.gui.className = 'hide';
			
			const result = this.score(pitch, tilt, rotate, x_0, y_0);
			console.log("orient:", result.orientation, "pos:", result.position);
			try{
				for(let type in result){
					showResult(result, type, this.feedback);
				} 
			}catch(e){
				console.error(e);
			}
	
		}else if(param === false){
			this.res.className = 'hide';
			this.resBtn.className = 'hide';
			this.gui.className = 'show';
		}else{
			console.error('Argument must be boolean of either true or false.');
		}
	
	}

}