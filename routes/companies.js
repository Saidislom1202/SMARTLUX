const express = require('express');
const makeCrudRouter = require('./_crudFactory');

const allowedFields = ['name', 'phone', 'address', 'note'];

module.exports = makeCrudRouter(express, 'companies', allowedFields);
