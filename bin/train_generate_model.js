/*

	This file is a part of node-on-train project.

	Copyright (C) Thanh D. Dang <thanhdd.it@gmail.com>

	node-on-train is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	node-on-train is distributed in the hope that it will be useful, but
	WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
	General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/


var fs = require('fs');
var path = require('path');
var inflection = require('inflection');
var root_app = process.cwd();
var migrationTime = require('../lib/helpers/migration_time.js');
var train_generate = require('./train_generate.js');

module.exports = function() {
	var model_name = process.argv[4];
	var model = model_name.toLowerCase();
	var model_plural = inflection.pluralize(model);
	var migration_file_name = migrationTime() + '_create_' + model_plural;

	var model_attrs = "";
	var migration_attrs = "";
	var require_modules = "";

	for (var i = 5; i < process.argv.length; i++) {
		var attr_str = process.argv[i].split(':');
		var attr_name = attr_str[0].toLowerCase();
		var db_type = attr_str[1].toUpperCase();
		if (db_type == 'REFERENCES') {
			// model.js
			model_attrs += '\t' + attr_name + '_id: {\n';
			model_attrs += '\t\ttype: Sequelize.INTEGER,\n';
			model_attrs += '\t\treferences: {\n';
			model_attrs += "\t\t\tmodel: '"+attr_name+"',\n";
			model_attrs += "\t\t\tkey: 'id'\n";
			model_attrs += '\t\t}\n';
			model_attrs += '\t},\n';

			// migration
			migration_attrs += "\t\t\t" + attr_name + "_id: {\n";
			migration_attrs += "\t\t\t\ttype: DataTypes.INTEGER,\n";
			migration_attrs += "\t\t\t\treferences: {\n";
			migration_attrs += "\t\t\t\t\tmodel: '"+attr_name+"',\n";
			migration_attrs += "\t\t\t\t\tkey: 'id',\n";
			migration_attrs += "\t\t\t\t}\n";
			migration_attrs += "\t\t\t},\n";
		} else {
			// model.js
			model_attrs += '\t' + attr_name + ': {\n';
			model_attrs += '\t\ttype: Sequelize.' + db_type + ',\n';
			model_attrs += '\t},\n';
	
			// migration
			migration_attrs += "\t\t\t" + attr_name + ": DataTypes." + db_type + ",\n";
		}
	}

	var file_templates = {
		'app/models/model.js': [
			{
				file_path: 'app/models/' + model + '.js',
				info_render: {
					model_name: model_name,
					model_attrs: model_attrs,
					model: model,
					require_modules: require_modules
				}
			}
		],
		'db/migrate/migration.js': [
			{
				file_path: 'db/migrate/' + migration_file_name + '.js',
				info_render: {
					model: model,
					migration_attrs: migration_attrs
				}
			}
		],
		'test/models/model_test.js': [
			{
				file_path: 'test/models/' + model + '_test.js',
				info_render: {
					model_name: model_name
				}
			}
		],
	}

	var lib  = path.join(path.dirname(fs.realpathSync(__filename)), '../');
	var path_templ = lib + 'template/model';

	train_generate(path_templ, null, file_templates);
}
