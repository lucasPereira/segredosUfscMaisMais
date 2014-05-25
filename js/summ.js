(function (){
	function Controle() {
		document.querySelector("#busca").addEventListener("keyup", this.buscar.bind(this));
		document.querySelector("#limpar").addEventListener("click", this.limpar.bind(this));
	}

	Controle.prototype.limpar = function (evento) {
		document.querySelector("#busca").value = "";
	};

	Controle.prototype.buscar = function (evento) {
		Summ.buscar(evento.target.value);
	};

	function Ui(cache) {
		this.raiz = document.querySelector("#postagens");
		cache.adicionarObservavel(this.inserirPostagem.bind(this));
	}

	Ui.prototype.inserirPostagem = function (postagem) {
		var identificador = postagem.id.split("_")[1];
		var mensagem = postagem.message;
		var enlace = Summ.construirUriPermanente(identificador);
		var curtidas = postagem.likes.data.length;
		var postagemDom = document.createElement("div");
		var mensagemDom = document.createElement("section");
		var textoMensagemDom = document.createElement("p");
		var rodapeDom = document.createElement("footer");
		var curtidasDom = document.createElement("small");
		var enlaceDom = document.createElement("a");
		postagemDom.setAttribute("id", identificador);
		postagemDom.classList.add("postagem");
		textoMensagemDom.textContent = mensagem;
		curtidasDom.textContent = curtidas + ((curtidas !== 1) ? " curtidas" : " curtida");
		enlaceDom.textContent = "Ir para o segredo";
		enlaceDom.setAttribute("href", enlace);
		mensagemDom.appendChild(textoMensagemDom);
		rodapeDom.appendChild(enlaceDom);
		rodapeDom.appendChild(curtidasDom);
		postagemDom.appendChild(mensagemDom);
		postagemDom.appendChild(rodapeDom);
		salvattore.append_elements(this.raiz, [postagemDom])
	};

	function Cache() {
		this.postagens = [];
		this.observadores = [];
		this.segredos = {};
		this.adms = {};
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
		var buscaSegredo = (/#[0-9]{1,4}/g).exec(filtro);
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
		var buscaAdm = (/#adm[0-9]/g).exec(filtro);
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
	}

	Cache.prototype.indexarSegredo = function (postagem) {
		var segredos = (/#[0-9]{1,4}/g).exec(postagem.message);
		if (segredos !== null) {
			for (var indice = 0; indice < segredos.length; indice++) {
				segredo = segredos[indice];
				if (this.segredos[segredo] === undefined) {
					this.segredos[segredo] = [];
				}
				this.segredos[segredo].push(postagem);
			}
		}
	};

	Cache.prototype.indexarAdm = function (postagem) {
		var adms = (/#adm[0-9]/g).exec(postagem.message);
		if (adms !== null) {
			for (var indice = 0; indice < adms.length; indice++) {
				adm = adms[indice];
				if (this.adms[adm] === undefined) {
					this.adms[adm] = [];
				}
				this.adms[adm].push(postagem);
			}
		}
	};

	Cache.prototype.guardar = function (maisPostagens) {
		for (var indice =0; indice < maisPostagens.length; indice++) {
			var postagem = maisPostagens[indice];
			if (postagem.message) {
				this.indexar(postagem);
			} else {
				maisPostagens.splice(indice, 1);
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
			console.log("Carregamento finalizado.");
			this.finalizacao();
		}
	};

	Carregador.prototype.receber = function (postagens) {
		console.log(postagens.data.length + " postagens carregadas.");
		this.cache.guardar(postagens.data);
		this.finalizacao();
		// this.carregarMais(postagens.paging);
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
			this.carregador.iniciar();
			this.carregador.avisarFinalizacao(this.finalizarCarregamento.bind(this));
		},

		finalizarCarregamento: function () {
			this.controle = new Controle();
		},

		buscar: function (filtro) {
			console.log(this.cache.buscar(filtro));
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
			console.log(resposta);
		}
	};

	window.addEventListener("load", function () {
		window.Summ = Summ;
		Summ.inicializar();
	});
}());
