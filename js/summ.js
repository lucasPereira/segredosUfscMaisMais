(function (){

	"use strict";

	function Controle(ui, cache) {
		this.ui = ui;
		this.cache = cache;
		this.buscaDom = document.querySelector("#busca");
		document.querySelector("#busca").addEventListener("keyup", this.buscar.bind(this));
		document.querySelector("#limpar").addEventListener("click", this.limpar.bind(this));
		this.cache.adicionarObservavel(this.buscar.bind(this));
	}

	Controle.prototype.limpar = function () {
		this.ui.sairDoModoBusca();
	};

	Controle.prototype.buscar = function () {
		var filtro = this.buscaDom.value;
		if (filtro.trim() === "") {
			this.ui.sairDoModoBusca();
		} else {
			filtro = filtro.replace(/\s(#)*/g, "#").replace(/^#?/, "#");
			var busca = this.cache.buscar(filtro);
			this.ui.entrarNoModoBusca(busca);
		}
	};

	function Ui(cache) {
		this.busca = [];
		this.raiz = document.querySelector("#postagens");
		cache.adicionarObservavel(this.inserirPostagem.bind(this));
	}

	Ui.prototype.inserirPostagem = function (postagem) {
		var identificador = postagem.id.split("_")[1];
		var mensagem = postagem.message;
		var enlace = Summ.construirUriPermanente(identificador);
		var curtidas = 0;
		if (postagem.likes !== undefined) {
			curtidas = postagem.likes.data.length;
		}
		var postagemDom = document.createElement("div");
		var mensagemDom = document.createElement("section");
		var textoMensagemDom = document.createElement("p");
		var rodapeDom = document.createElement("footer");
		var curtidasDom = document.createElement("small");
		var enlaceDom = document.createElement("a");
		postagemDom.setAttribute("id", identificador);
		postagemDom.classList.add("postagem");
		textoMensagemDom.textContent = mensagem;
		var textoCurtidas;
		switch (curtidas) {
			case 1:
				textoCurtidas = "1 curtida";
				break;
			case 25:
				textoCurtidas = "Mais de 25 curtidas";
				break;
			default:
				textoCurtidas = curtidas + " curtidas";
				break;
		}
		curtidasDom.textContent = textoCurtidas;
		enlaceDom.textContent = "Ir para o segredo";
		enlaceDom.setAttribute("href", enlace);
		mensagemDom.appendChild(textoMensagemDom);
		rodapeDom.appendChild(enlaceDom);
		rodapeDom.appendChild(curtidasDom);
		postagemDom.appendChild(mensagemDom);
		postagemDom.appendChild(rodapeDom);
		salvattore.append_elements(this.raiz, [postagemDom])
	};

	Ui.prototype.iniciarCarregamento = function () {
		document.querySelector("#summ header > div.carregamento img").classList.add("visivel");
		document.querySelector("#summ header > div.carregamento p").textContent = "(Poderá levar um tempo para carregar todos segredos.)";

	};

	Ui.prototype.finalizarCarregamento = function () {
		document.querySelector("#summ header > div.carregamento img").classList.remove("visivel");
		document.querySelector("#summ header > div.carregamento p").textContent = "Todos segredos carregados.";
	};

	Ui.prototype.finalizarCarregamentoComErro = function () {
		document.querySelector("#summ header > div.carregamento img").classList.remove("visivel");
		document.querySelector("#summ header > div.carregamento p").textContent = "Ocorreu um erro ao obter os segredos. Foi mau ae.";
	};

	Ui.prototype.entrarNoModoBusca = function (busca) {
		this.limparSelecoes();
		this.busca = busca;
		document.querySelector("#postagens").classList.add("modoBusca");
		for (var indice = 0; indice < busca.length; indice++) {
			var postagem = busca[indice];
			var identificador = postagem.id.split("_")[1];
			document.getElementById(identificador).classList.add("visivel");
		}
	};

	Ui.prototype.limparSelecoes = function () {
		var busca = this.busca;
		for (var indice = 0; indice < busca.length; indice++) {
			var postagem = busca[indice];
			var identificador = postagem.id.split("_")[1];
			document.getElementById(identificador).classList.remove("visivel");
		}
	};

	Ui.prototype.sairDoModoBusca = function () {
		document.querySelector("#busca").value = "";
		document.querySelector("#postagens").classList.remove("modoBusca");
		this.limparSelecoes();
	};

	function Cache() {
		this.postagens = [];
		this.observadores = [];
		this.segredos = {};
		this.adms = {
			"#adm": []
		};
	}

	Cache.prototype.adicionarObservavel = function (tratador) {
		this.observadores.push(tratador);
	};

	Cache.prototype.notificarObservadores = function (postagens) {
		var indiceObservavel;
		var tamanhoObservavel;
		for (indiceObservavel = 0, tamanhoObservavel = this.observadores.length; indiceObservavel < tamanhoObservavel; indiceObservavel++) {
			var indice;
			var tamanho;
			var observador = this.observadores[indiceObservavel];
			for (indice = 0, tamanho = postagens.length; indice < tamanho; indice++) {
				var postagem = postagens[indice];
				observador(postagens[indice]);
			}
		}
	};

	Cache.prototype.buscar = function (filtro) {
		var resultados = [];
		this.buscarSegredo(filtro, resultados);
		this.buscarAdm(filtro, resultados);
		return resultados;
	};

	Cache.prototype.buscarSegredo = function (filtro, resultados) {
		var buscaSegredo = filtro.match(/#[0-9]{1,4}/g);
		if (buscaSegredo !== null) {
			for (var indiceSegredo = 0; indiceSegredo < buscaSegredo.length; indiceSegredo++) {
				var busca = buscaSegredo[indiceSegredo];
				if (this.segredos[busca] !== undefined) {
					resultados.push.apply(resultados, this.segredos[busca]);
				}
			}
		}
	};

	Cache.prototype.buscarAdm = function (filtro, resultados) {
		var buscaAdm = filtro.match(/#adm[0-9]?/g);
		if (buscaAdm !== null) {
			for (var indiceAdm = 0; indiceAdm < buscaAdm.length; indiceAdm++) {
				var busca = buscaAdm[indiceAdm];
				if (this.adms[busca] !== undefined) {
					resultados.push.apply(resultados, this.adms[busca]);
				}
			}
		}
	};

	Cache.prototype.indexar = function (postagem) {
		this.indexarSegredo(postagem);
		this.indexarAdm(postagem);
	};

	Cache.prototype.indexarSegredo = function (postagem) {
		var segredos = postagem.message.match(/#[0-9]{1,4}/g)
		if (segredos !== null) {
			for (var indice = 0; indice < segredos.length; indice++) {
				var segredo = segredos[indice];
				if (this.segredos[segredo] === undefined) {
					this.segredos[segredo] = [];
				}
				this.segredos[segredo].push(postagem);
			}
		}
	};

	Cache.prototype.indexarAdm = function (postagem) {
		var adms = postagem.message.match(/#adm[0-9]/g)
		if (adms !== null) {
			for (var indice = 0; indice < adms.length; indice++) {
				var adm = adms[indice];
				if (this.adms[adm] === undefined) {
					this.adms[adm] = [];
				}
				this.adms[adm].push(postagem);
				this.adms["#adm"].push(postagem);
			}
		}
	};

	Cache.prototype.guardar = function (maisPostagens) {
		for (var indice = 0; indice < maisPostagens.length; indice++) {
			var postagem = maisPostagens[indice];
			if (postagem.message !== undefined && postagem.story === undefined) {
				this.indexar(postagem);
			} else {
				maisPostagens.splice(indice, 1);
				indice--;
			}
		}
		this.postagens.push.apply(this.postagens, maisPostagens);
		this.notificarObservadores(maisPostagens);
	};

	function Carregador(cache) {
		this.cache = cache;
	}

	Carregador.prototype.iniciar = function () {
		Summ.api(Summ.construirUri("/posts"), this.receber.bind(this));
	};

	Carregador.prototype.carregarMais = function (paginacao) {
		if (paginacao && paginacao.next) {
			Summ.api(paginacao.next.replace("&limit=25", "&limit=100"), this.receber.bind(this));
		} else {
			this.finalizacao();
		}
	};

	Carregador.prototype.receber = function (postagens) {
		this.cache.guardar(postagens.data);
		this.carregarMais(postagens.paging);
	};

	Carregador.prototype.avisarFinalizacao = function (tratador) {
		this.finalizacao = tratador;
	};

	var Summ = {
		pagina: "/1427046280887158",
		ai: "1458276754417230",
		as: "0991b0f73b131b6ff9e6533a50c313e0",

		inicializar: function () {
			this.cache = new Cache();
			this.ui = new Ui(this.cache);
			this.carregador = new Carregador(this.cache);
			this.ui.iniciarCarregamento();
			this.carregador.iniciar();
			this.controle = new Controle(this.ui, this.cache);
			this.carregador.avisarFinalizacao(this.finalizarCarregamento.bind(this));
		},

		finalizarCarregamento: function () {
			this.ui.finalizarCarregamento();
		},

		construirUriPermanente: function (identificador) {
			return ("https://www.facebook.com" + this.pagina + "/posts/" + identificador);
		},

		construirUri: function (uri) {
			return (this.pagina + uri + "?access_token=" + this.ai + "|" + this.as);
		},

		api: function (uri, tratador) {
			FB.api(uri, function (resposta) {
				if (!resposta || resposta.error) {
					this.tratarErro(resposta);
				} else {
					tratador(resposta);
				}
			}.bind(this));
		},

		tratarErro: function (resposta) {
			this.ui.finalizarCarregamentoComErro();
		}
	};

	window.addEventListener("load", function () {
		window.Summ = Summ;
		Summ.inicializar();
	});

}());
