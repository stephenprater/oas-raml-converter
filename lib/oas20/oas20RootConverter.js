const _ = require('lodash');
const Converter = require('../model/converter');
const MediaType = require('../model/mediaType');
const BaseUri = require('../model/baseUri');
const Root = require('../model/root');
const Oas20InfoConverter = require('../oas20/Oas20InfoConverter');
const url = require('url');

class Oas20RootConverter extends Converter{

	export(model) {
		return _.isEmpty(model)? {} : this._export(model);
	}

	import(oasDef) {
		return _.isEmpty(oasDef)? {} : this._import(oasDef);
	}

	_export(model) {
		const attrIdMap = {
			'protocols': 'schemes'
		};
		const attrIdSkip = ['info', 'baseUri', 'mediaType', 'documentation', 'baseUriParameters', 'securityDefinitions', 'resources', 'types', 'resourceTypes'];
		const oasDef = Converter.copyObjectFrom(model, attrIdMap, attrIdSkip);

		if (model.hasOwnProperty('info')) {
			const oas20InfoConverter = new Oas20InfoConverter();
			oasDef.info = oas20InfoConverter.export(model.info);
		}

		if (model.hasOwnProperty('baseUri')) {
			const baseUri = model.baseUri;
			if (baseUri.hasOwnProperty('host')) oasDef.host = baseUri.host;
			if (baseUri.hasOwnProperty('basePath')) oasDef.basePath = baseUri.basePath;
			if (!oasDef.host && !oasDef.basePath && baseUri.uri){
				let protocol = url.parse(baseUri.uri).protocol;
				if (protocol){
					protocol = protocol.slice(0, -1).toLowerCase();
					oasDef['x-basePath'] = baseUri.uri.replace(protocol + '://','');
					if (oasDef.schemes) {
						oasDef.schemes.push(protocol);
					} else {
						oasDef.schemes = [protocol];
					}
				} else {
					oasDef['x-basePath'] = baseUri.uri;
				}
			}
		}

		if (model.hasOwnProperty('mediaType')) {
			const mediaType = model.mediaType;
			if (mediaType.hasOwnProperty('consumes')) oasDef.consumes = mediaType.consumes;
			if (mediaType.hasOwnProperty('produces')) oasDef.produces = mediaType.produces;
		}

		return oasDef;
	}

	_import(oasDef) {
		const model = new Root();

		if (oasDef.hasOwnProperty('schemes')) model.protocols = oasDef.schemes;

		if (oasDef.hasOwnProperty('info')) {
			const oas20InfoConverter = new Oas20InfoConverter();
			model.info = oas20InfoConverter.import(oasDef.info);
		}

		const baseUri = new BaseUri();
		if (oasDef.hasOwnProperty('x-basePath')) {
			baseUri.uri = oasDef['x-basePath'];
			const parsedURL = url.parse(baseUri.uri);
			if (parsedURL.host) {
				baseUri.host = parsedURL.host;
			}
		} else {
			if (oasDef.hasOwnProperty('host')) baseUri.host = oasDef.host;
			if (oasDef.hasOwnProperty('basePath')) baseUri.basePath = oasDef.basePath;
			if (baseUri.host) {
				let baseProtocol = 'http';
				if (model.protocols) {
					baseProtocol = model.protocols[0];
				}
				baseUri.uri = baseProtocol + '://' + baseUri.host + baseUri.basePath;
			}
		}
		if (!_.isEmpty(baseUri)) model.baseUri = baseUri;

		const mediaType = new MediaType();
		if (oasDef.hasOwnProperty('consumes')) {
			mediaType.consumes = oasDef.consumes;
			if (_.isEmpty(mediaType.mimeTypes)) {
				mediaType.mimeTypes = mediaType.consumes;
			} else {
				mediaType.mimeTypes = mediaType.mimeTypes.concat(mediaType.consumes);
			}
		}
		if (oasDef.hasOwnProperty('produces')) {
			mediaType.produces = oasDef.produces;
			if (_.isEmpty(mediaType.mimeTypes)) {
				mediaType.mimeTypes = mediaType.produces;
			} else {
				mediaType.mimeTypes = mediaType.mimeTypes.concat(mediaType.produces);
			}
		}
		if (!_.isEmpty(mediaType)) {
			model.mediaType = mediaType;
		}

		return model;
	}
}

module.exports = Oas20RootConverter;