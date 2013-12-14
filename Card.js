// JavaScript Document
var RESULT = {
HIGH_CARD:'highcard',
ONE_PAIR:'one pair',
TWO_PAIR:'two pair',
THREE_OF_A_KIND:'three of a kind',
HIGH_STRAIGHT:'high straight',
FLUSH:'flush',
FULL_HOUSE:'full house',
FOUR_OF_A_KIND:'four or a kind',
STRAIGHT_FLUSH:'straight flush',
NOTHING:'nothing'
};

var KeyValue = Backbone.Model.extend({
									 defaults:{
										 Key:'',
										 Value:''
									 }
									 });

var ScoreItem = Backbone.Model.extend({
	defaults:{
		Key:'',
		Value:'',
		Multiplier:0
	}
});

KeyValueCollection = Backbone.Collection.extend({
													model: KeyValue
													});

var Card = Backbone.Model.extend({
								 defaults:{
									 Face:'',
									 Value:'',
									 Image:'',
									 Back:'',
									 Flipped:false
								 },
								 
								 getRank:function(){
									 if(this.get('Value')==='Ace'){
										 return 1;
									 }
									 if(this.get('Value')==='Jack'){
										 return 11;
									 }
									 if(this.get('Value')==='Queen'){
										 return 12;
									 }
									 if(this.get('Value')==='King'){
										 return 13;
									 }
									 return this.get('Value');
								 },
								 
								 getFace:function(){
									 return this.get('Face');
								 }
								 
								 });
								 
var DeckCollection = Backbone.Collection.extend({
												model: Card
												});
var CardModule = function(){

	var faces = {Diamond:"Diamond",Club:"Club",Spade:"Spade",Heart:"Heart"};
	var deck = new DeckCollection();
	var shuffled;
		
	init = function(){
		console.log("init");
		deck.reset();
		
		_.each(faces,function(face){
							  console.log("face: "+face);
							  var f = face[0].toLowerCase();
							  deck.push(new Card({Face:face,Value:'Ace',Image:'images/deck/'+f+'1.png',Back:'images/deck/b1fv.png'}));
							  for(var i=2;i<11;i++){
								  deck.push(new Card({Face:face,Value:i,Image:'images/deck/'+f+i+'.png',Back:'images/deck/b1fv.png'}));
							  }
							  deck.push(new Card({Face:face,Value:'Jack',Image:'images/deck/'+f+'j.png',Back:'images/deck/b1fv.png'}));
							  deck.push(new Card({Face:face,Value:'Queen',Image:'images/deck/'+f+'q.png',Back:'images/deck/b1fv.png'}));
							  deck.push(new Card({Face:face,Value:'King',Image:'images/deck/'+f+'k.png',Back:'images/deck/b1fv.png'}));
							  });
	};
	
	scores = function(){
		var scorelist = new KeyValueCollection();
		var arr = [];
		_.each(RESULT,function(res){
							   arr.push(res);
							   });
		for(var i=(arr.length-2);i>0;i--){
			var item = new ScoreItem({Key:arr[i],Value:i,Multiplier:i-1});
			scorelist.push(item);
		}
		return scorelist;
	};
	
	shuffle = function(){
		var curIndex = deck.length;
		var tmpValue;
		var randomIndex;
		var tmpDeck = new DeckCollection();
		
		while(0!==curIndex){
			randomIndex = Math.floor(Math.random() * (curIndex - 1) + 0);
			curIndex-=1;
			tmpDeck.push(deck.remove(deck.at(randomIndex)));
		}
		deck = tmpDeck;
	};
	
	deal = function(count){
		var cards = new DeckCollection();
		for(var i=0;i<count;i++){
			cards.push(deck.remove(deck.at(0)));
		}
		return cards;
	};
	
	checkHand = function(handModel){
		console.log("checkHand");
		var sameValue = 0;
		var ranks =[];
		var value = [];
		var orderedRanks = [];
        var flush=true, straight=false;
        var sameCards=1,sameCards2=1;
        var largeGroupRank=0,smallGroupRank=0;
        var index=0;
        var topStraightValue=0;
		var result = RESULT.NOTHING;
		
		for(var i=0;i<13;i++){
			ranks[i]=0;
		}
		for(var i=0;i<handModel.length;i++){
			ranks[handModel.at(i).getRank()]++;
		}
		
		for(var i=0;i<(handModel.length-1);i++){
			console.log("face: "+handModel.at(i).getFace());
			if(handModel.at(i).getFace()!==handModel.at(i+1).getFace()){
				flush = false;
			}
		}
		
		for(var i=13;i>=1;i--){
			if(ranks[i]>sameCards){
				if(sameCards!==1){
					sameCards2 = sameCards;
					smallGroupRank = largeGroupRank;					
				}
				sameCards = ranks[i];
				largeGroupRank = i;							
			}else if(ranks[i]>sameCards2){
				sameCards2 = ranks[i];
				smallGroupRank = i;				
			}
		}
		
		if (ranks[1]==1) //if ace, run this before because ace is highest card
        {
            orderedRanks[index]=14;
            index++;
        }

        for (var x=13; x>=2; x--)
        {
            if (ranks[x]==1)
            {
                orderedRanks[index]=x; //if ace
                index++;
            }
        }
        
        for (var x=1; x<=9; x++)
        //can't have straight with lowest value of more than 10
        {
            if (ranks[x]==1 && ranks[x+1]==1 && ranks[x+2]==1 && 
                ranks[x+3]==1 && ranks[x+4]==1)
            {
                straight=true;
                topStraightValue=x+4; //4 above bottom value
                break;
            }
        }

        if (ranks[10]==1 && ranks[11]==1 && ranks[12]==1 && 
            ranks[13]==1 && ranks[1]==1) //ace high
        {
            straight=true;
            topStraightValue=14; //higher than king
        }
        
        for (var x=0; x<=5; x++)
        {
            value[x]=0;
        }
		
		//start hand evaluation
        if ( sameCards==1 ) {
            value[0]=1;
            value[1]=orderedRanks[0];
            value[2]=orderedRanks[1];
            value[3]=orderedRanks[2];
            value[4]=orderedRanks[3];
            value[5]=orderedRanks[4];
        }

        if (sameCards==2 && sameCards2==1)
        {
            value[0]=2;
            value[1]=largeGroupRank; //rank of pair
            value[2]=orderedRanks[0];
            value[3]=orderedRanks[1];
            value[4]=orderedRanks[2];
        }

        if (sameCards==2 && sameCards2==2) //two pair
        {
            value[0]=3;
            //rank of greater pair
            value[1]= largeGroupRank>smallGroupRank ? largeGroupRank : smallGroupRank;
            value[2]= largeGroupRank<smallGroupRank ? largeGroupRank : smallGroupRank;
            value[3]=orderedRanks[0];  //extra card
        }

        if (sameCards==3 && sameCards2!=2)
        {
            value[0]=4;
            value[1]= largeGroupRank;
            value[2]=orderedRanks[0];
            value[3]=orderedRanks[1];
        }

        if (straight && !flush)
        {
            value[0]=5;
            value[1]=0;
        }

        if (flush && !straight)
        {
            value[0]=6;
            value[1]=orderedRanks[0]; //tie determined by ranks of cards
            value[2]=orderedRanks[1];
            value[3]=orderedRanks[2];
            value[4]=orderedRanks[3];
            value[5]=orderedRanks[4];
        }

        if (sameCards==3 && sameCards2==2)
        {
            value[0]=7;
            value[1]=largeGroupRank;
            value[2]=smallGroupRank;
        }

        if (sameCards==4)
        {
            value[0]=8;
            value[1]=largeGroupRank;
            value[2]=orderedRanks[0];
        }

        if (straight && flush)
        {
            value[0]=9;
            value[1]=0;
        }
		
		switch( value[0] )
        {

            case 1:
                //result = RESULT.HIGH_CARD;
				result = RESULT.NOTHING;
                break;
            case 2:
				result = RESULT.ONE_PAIR;
                break;
            case 3:
				result = RESULT.TWO_PAIR;
                break;
            case 4:
				result = RESULT.THREE_OF_A_KIND;
                break;
            case 5:
				result = RESULT.HIGH_STRAIGHT;
                break;
            case 6:
				result = RESULT.FLUSH;
                break;
            case 7:
				result = RESULT.FULL_HOUSE;
                break;
            case 8:
				result = RESULT.FOUR_OF_A_KIND;
                break;
            case 9:
				result = RESULT.STRAIGHT_FLUSH;
                break;
            default:
				result = RESULT.NOTHING;
        }

		return result;
	};
	
	
	return {
		init:init,
		deal:deal,
		shuffle:shuffle,
		checkHand: checkHand,
		scores: scores
	};
}();

