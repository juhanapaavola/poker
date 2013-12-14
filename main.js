// JavaScript Document
var app = {
	cards:{},
	router:{}
};

var STATE = {
	FIRST:'first',
	FINISH:'finish'
};

var MONEY = 50;
var MAX_BET = 5;
var PokerProxy = {};
_.extend(PokerProxy,Backbone.Events);

$(document).ready(function(){
						   app.router = new app.Router();
						   Backbone.history.start();
						   app.router.navigate("main",{trigger:true});
						   });

app.MoneyModel = Backbone.Model.extend({
									   defaults:{
										   Money:0,
										   Pot:0
									   }
									   });

app.Router = Backbone.Router.extend({
									currentView: null,
									
									routes:{
										"main":"main"
									},
									
									main:function(){
										var v = new app.MainView();
										this.changeView(v);
									},
									
									changeView:function(view){
										if(this.currentView!==null){
											this.currentView.undelegateEvents();
										}
										this.currentView = view;
										this.currentView.render();
										$('body').append($(this.currentView.el));
									},
									
									initialize:function(){
										
									}
													
									});

app.CardView = Backbone.View.extend({
									tagName:"td",
									enabled: true,
									
									events:{
										"click img":"flip"
									},
									
									flip:function(event){
										console.log("flip");
										event.preventDefault();
										if(this.enabled){
											var img = this.model.get('Image');
											this.model.set('Image',this.model.get('Back'));
											this.model.set('Back',img);
											this.model.set('Flipped',!this.model.get('Flipped'));
											this.render();											
										}
									},
									
									template: _.template($("#card-template").html()),
									render:function(){
										console.log("CardView render");
										$(this.el).html(this.template(this.model.toJSON()));
										return this;
									},
									
									setEnable: function(enable){
										this.enabled = enable;
									},
									
									close:function(){
										this.remove();
										this.off();
									}
									});

app.HandView = Backbone.View.extend({
									state: STATE.FIRST,
			
									listview: [],

									render:function(){
										$(this.el).html();
										_.each(this.listview,function(view){
																 view.close();
																 });
										
										this.listview = [];									
										this.listview = _.map(this.model.models,function(item){
																					return new app.CardView({model:item});
																					});
										$(this.el).append(_.map(this.listview,function(item){
																					   return item.render().el;
																					   })
														  );
										return this;
									},

									initialize:function(){
										CardModule.init();
										CardModule.shuffle();

										this.model = CardModule.deal(5);
										this.model.on("reset",this.render,this);
										this.model.on("add",this.render,this);
										this.textTimer = $.timer(function(){
																		  if($(".win-text").text().indexOf("You win")!==-1){
																			  $(".win-text").text("Push deal");
																		  }else{
																			  $(".win-text").text("You win");																		  
																		  }																		  
																		  });
										this.textTimer.set({time:500});
									},
									
									textTimer: null,
									
									deal:function(){
										if(this.state === STATE.FIRST){
											var todeal = [];
											var that = this;
											this.model.each(function(card){
																	 if(card.get('Flipped')){
																		 todeal.push(that.model.indexOf(card));
																	 }
																	 });
											_.each(todeal,function(pos){
																   that.model.remove(that.model.at(pos));
																   that.model.add(CardModule.deal(1).at(0),{at:pos});
																   });
										
											_.each(this.listview,function(card){																	 
																	 card.setEnable(false);
																	 });
											var didWin = CardModule.checkHand(this.model);
											console.log("didWin: "+didWin);
											if(didWin!==RESULT.NOTHING){
												//
												this.textTimer.play();
											}else{
												$(".win-text").text("Push deal");
											}
											PokerProxy.trigger('deal',didWin);
											this.state = STATE.FINISH;
											$("#bet-button").css("display","none");											
										}else{
											CardModule.init();
											CardModule.shuffle();
											this.textTimer.stop();
											this.model.reset(CardModule.deal(5).toJSON());		
											this.state = STATE.FIRST;
											_.each(this.listview,function(card){																	 
																	 card.setEnable(true);
																	 });
											$(".win-text").text("Select cards");
											PokerProxy.trigger('deal',RESULT.NOTHING);
											$("#bet-button").css("display","block");
										}
									},
														  
									getState:function(){
										return this.state;
									}
									});

app.DeckView = Backbone.View.extend({
									template: _.template($("#deck-template").html()),
									
									render:function(){
										$(this.el).html(this.template());
										return this;	
									}									
									});

app.MoneyView = Backbone.View.extend({
									 template: _.template($("#money-template").html()),
									 pot: 0,
									 currentBet: 1,
									 
									 render:function(){
										 $(this.el).html(this.template(this.model.toJSON()));
										 return this;
									 },
									 
									 initialize:function(){
										 this.model.on("sync",this.render,this);
										 this.model.on("change",this.render,this);
										 this.model.on("reset",this.render,this);
										 PokerProxy.on("deal",this.deal,this);
									 },
									 
									 deal:function(addToMoney){
										 if(addToMoney!==RESULT.NOTHING){
											 this.model.set('Money',this.model.get('Money')+this.model.get('Pot'));
										 }else{
											 this.model.set('Money',this.model.get('Money')-this.model.get('Pot'));
										 }
 										 this.model.set('Pot',1);
									 },
									 
									 bet:function(amount){
										 var money = this.model.get('Money');
										 var pot = this.model.get('Pot');
										 var tmp = this.currentBet+amount;

										 if(tmp<6){
											 this.currentBet+=amount;
											 money-=amount;
											 if(money>-1){
												 pot+=amount;
												 this.model.set('Pot',pot);											 
											 }
										 }else{
											 this.currentBet = 1;
											 this.model.set('Pot',this.currentBet);
										 }
										 return this.currentBet;
									 }
									 
									 });

app.ScoreViewItem = Backbone.View.extend({
										 template: _.template($("#score-template").html()),
										 tagName: "li",
										 className: "list-group-item",
										 
										 render:function(){
											 $(this.el).html(this.template(this.model.toJSON()));
											 return this;
										 },
										 
										 initialize:function(){
											 PokerProxy.on('deal',this.highlight,this);
										 },
										 
										 highlight:function(result){
											 if(result===this.model.get('Value')){
												 $(this.el).css("color","red");
												 $(this.el).toggleClass("win-animation",true);
											 }
											 if(result===RESULT.NOTHING){
												 $(this.el).css("color","black");												 
 												 $(this.el).toggleClass("win-animation",false);
											 }
										 },

										 close:function(){
										 	this.off();
										 	this.remove();
										 }
										 
										 });

app.ScoreView = Backbone.View.extend({									
									listview: [],
									
									 bet:function(bet){
										console.log("bet: "+bet);
										this.model.each(function(item){
											item.set('Value',bet+item.get('Multiplier')*bet);
										});										
									},

									initialize:function(){
										 this.model.on("change",this.render,this);
									},

									render:function(){
										console.log("ScoreView render: "+JSON.stringify(this.model));
										_.each(this.listview,function(view){
																 view.close();
																 });
										
										this.listview = [];									
										this.listview = _.map(this.model.models,function(item){
																					return new app.ScoreViewItem({model:item});
																					});
										$(this.el).append(_.map(this.listview,function(item){
																					   return item.render().el;
																					   })
														  );

										return this;	
									}									
									});

app.MainView = Backbone.View.extend({
									template: _.template($("#card-view").html()),
									handview:{},
									deckview:{},
									moneyview: {},
									scoreview: {},
									
									events:{
										"click #deal-button":"deal",
										"click #bet-button":"bet"
									},
									
									bet:function(event){
										event.preventDefault();
										var b = this.moneyview.bet(1);
										this.scoreview.bet(b);
									},

									deal:function(event){
										console.log("deal");
										event.preventDefault();
										this.handview.deal();

										if(this.handview.getState() === STATE.FINISH){
											$(this.el).find("#deal-button").toggleClass("buttonblink-animation",true);
											$(this.el).find("#bet-button").toggleClass("buttonblink-animation",true);
										}else{
											$(this.el).find("#deal-button").toggleClass("buttonblink-animation",false);
											$(this.el).find("#bet-button").toggleClass("buttonblink-animation",false);
										}
									},
									
									render:function(){
										console.log("MainView render");
										return this;
									},
									
									initialize:function(){
										$(this.el).html(this.template());
										this.handview = new app.HandView({el:$(this.el).find('tr#deck-row')});
										this.handview.render();
										this.deckview = new app.DeckView({el:$(this.el).find("td#deck-back")});
										this.deckview.render();
										
										var moneyModel = new app.MoneyModel({Money:MONEY,Pot:1});
										this.moneyview = new app.MoneyView({el:$(this.el).find("#money-view"), model: moneyModel});
										this.moneyview.render();
										
										var scoremodel = CardModule.scores();
										this.scoreview = new app.ScoreView({el:$(this.el).find("ul#score-list"), model: scoremodel});
										this.scoreview.render();
									}
									
									});

