import Element from './element/element';
import Router from './router/router';
import Fetcher from './fetcher';

export default Object.freeze(new class Oxe {

    XElement = Element;
    Element = Element;
    element = Element;

    XFetcher = Fetcher;
    Fetcher = Fetcher;
    fetcher = Fetcher;

    XRouter = Router;
    Router = Router;
    router = Router;

});

