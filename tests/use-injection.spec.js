/* global describe, it, expect */

require('../lib/twilio.mock');

const {
  typeOf,
  useInjection,
  BadRequestError,
  InternalServerError,
  Response,
  TwiMLResponse,
  NotFoundError,
} = require('../index');

describe('Function typeOf', () => {
  it('Should return Array', () => {
    expect(typeOf(['one', 'two', 'three'])).toEqual('Array');
  });
  it('Should return String', () => {
    expect(typeOf('one')).toEqual('String');
  });
  it('Should return Object', () => {
    expect(typeOf({ one: 'object' })).toEqual('Object');
  });
  it('Should return Null', () => {
    expect(typeOf(null)).toEqual('Null');
  });
  it('Should return Undefined', () => {
    expect(typeOf(undefined)).toEqual('Undefined');
  });
  it('Should return Symbol', () => {
    expect(typeOf(Symbol('s'))).toEqual('Symbol');
  });
  it('Should return Number', () => {
    expect(typeOf(1)).toEqual('Number');
  });
  it('Should return Number', () => {
    expect(typeOf(NaN)).toEqual('Number');
  });
  it('Should return Number', () => {
    expect(typeOf(-1)).toEqual('Number');
  });
  it('Should return String', () => {
    expect(typeOf('-1')).toEqual('String');
  });
  it('Should return Map', () => {
    expect(typeOf(new Map())).toEqual('Map');
  });
  it('Should return Function', () => {
    expect(typeOf(class MyClass {})).toEqual('Function');
  });
  it('Should return Function', () => {
    expect(typeOf(function MyFunction() {})).toEqual('Function'); //eslint-disable-line
  });
});

const responseTypes = {
  twiml: () => new TwiMLResponse(),
  badRequest: () => new BadRequestError(),
  internalServer: () => new InternalServerError(),
  notFound: () => new NotFoundError(),
  response: (provided) => new Response(provided),
};

function useItToMock(event) {
  const provided = this.providers.useItAsProvider(event);

  if (event.forceFail) {
    throw new Error('Check fail condition!');
  }

  return responseTypes[provided.type](provided);
}

function useItAsProvider(event) {
  Object.defineProperty(
    event, 'evaluated', {
      value: true,
      enumerable: true,
    },
  );

  return event;
}

const fn = useInjection(useItToMock, {
  providers: {
    useItAsProvider,
  },
});

const twilioContext = {
  getTwilioClient() {

  },
  DOMAIN_NAME: 'https://localhost:3000',
};
const twilioCallback = function (err, response) {
  if (err) {
    return err;
  }

  return response;
};

describe('Function useInjection', () => {
  it('Should respond with an InternalServerError Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'response', forceFail: true }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(InternalServerError);
    expect(callback.body).toEqual('[ InternalServerError ]: Check fail condition!');
  });
  it('Should respond with a TwiMLResponse Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'twiml' }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(TwiMLResponse);
    expect(callback.body).toEqual('<?xml version="1.0" encoding="UTF-8"?><Response />');
  });
  it('Should respond with a Response Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'response' }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(Response);
    expect(callback.body).toEqual({ evaluated: true, type: 'response' });
  });
  it('Should respond with a BadRequestError Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'badRequest' }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(BadRequestError);
    expect(callback.body).toEqual('[ BadRequestError ]: The request sent to the server is invalid or corrupted!');
  });
  it('Should respond with a NotFoundError Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'notFound' }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(NotFoundError);
    expect(callback.body).toEqual('[ NotFoundError ]: The content you are looking for was not found!');
  });
  it('Should respond with a InternalServerError Instance', async () => {
    const callback = await fn(
      twilioContext, { type: 'internalServer' }, twilioCallback,
    );

    expect(callback).toBeInstanceOf(InternalServerError);
    expect(callback.body).toEqual('[ InternalServerError ]: The server encountered an unexpected condition that prevented it from fulfilling the request!');
  });
});
