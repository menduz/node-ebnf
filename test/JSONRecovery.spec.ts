declare var describe, it, require;

import { Grammars, Parser, IToken } from '../dist';
import { testParseTokenFailsafe, describeTree, printBNF, testParseToken } from './TestHelpers';

let inspect = require('util').inspect;
let expect = require('expect');


let grammar = `
/* https://www.ietf.org/rfc/rfc4627.txt */
value                ::= false | null | true | object | number | string | array
BEGIN_ARRAY          ::= WS* #x5B WS*  /* [ left square bracket */
BEGIN_OBJECT         ::= WS* #x7B WS*  /* { left curly bracket */
END_ARRAY            ::= WS* #x5D WS*  /* ] right square bracket */
END_OBJECT           ::= WS* #x7D WS*  /* } right curly bracket */
NAME_SEPARATOR       ::= WS* #x3A WS*  /* : colon */
VALUE_SEPARATOR      ::= WS* #x2C WS*  /* , comma */
WS                   ::= [#x20#x09#x0A#x0D]+   /* Space | Tab | \n | \r */
false                ::= "false"
null                 ::= "null"
true                 ::= "true"
object               ::= BEGIN_OBJECT object_content? END_OBJECT
object_content       ::= (member (VALUE_SEPARATOR member)*) { recoverUntil=END_OBJECT }
Key                  ::= string { recoverUntil = NAME_SEPARATOR }
OBJECT_RECOVERY      ::= END_OBJECT | VALUE_SEPARATOR
ARRAY_RECOVERY       ::= END_ARRAY | VALUE_SEPARATOR
member               ::= Key NAME_SEPARATOR value { recoverUntil=OBJECT_RECOVERY }
array                ::= BEGIN_ARRAY array_content? END_ARRAY
array_content        ::= array_value (VALUE_SEPARATOR array_value)* { recoverUntil=ARRAY_RECOVERY,fragment=true }
array_value          ::= value { recoverUntil=ARRAY_RECOVERY, fragment=true }

number               ::= "-"? ("0" | [1-9] [0-9]*) ("." [0-9]+)? (("e" | "E") ( "-" | "+" )? ("0" | [1-9] [0-9]*))?

/* STRINGS */

string                ::= '"' (([#x20-#x21] | [#x23-#x5B] | [#x5D-#xFFFF]) | #x5C (#x22 | #x5C | #x2F | #x62 | #x66 | #x6E | #x72 | #x74 | #x75 HEXDIG HEXDIG HEXDIG HEXDIG))* '"'
HEXDIG                ::= [a-fA-F0-9]
  `;

describe('JSON 2', () => {
  describe('Parse JSON', () => {
    let parser: Parser;

    it('create parser', () => {
      printBNF(Grammars.Custom.parser);
      // console.dir(Grammars.Custom.parser.getAST(grammar));
    });
  });

  describe('Grammars.Custom parses JSON grammar', function () {
    let parser = new Grammars.Custom.Parser(grammar, {});

    printBNF(parser);

    testParseTokenFailsafe(parser, '{"b": ZZZZ}', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '[ZZZZ]', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '[1, ZZZZ]', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '[1, ZZZZ, 1]', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '[ZZZZ, 1]', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '{"b": ZZZZ, "c": true}', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });

    testParseTokenFailsafe(parser, '{"a":false,"b": ZZZZ,"list":[1,2,3,true]}', null, (doc) => {
      expect(doc.errors.length).toEqual(1);
      expect(doc.errors[0].token.type).toEqual('SyntaxError');
      expect(doc.errors[0].token.text).toEqual('ZZZZ');
    });
  });
});