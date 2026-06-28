const express = require('express');
const makeCrudRouter = require('./_crudFactory');

const allowedFields = ['type', 'amount', 'category', 'note', 'entry_date', 'created_by'];

module.exports = makeCrudRouter(express, 'finance', allowedFields);
