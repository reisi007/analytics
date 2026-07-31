FROM php:8.5-fpm-alpine

RUN apk add --no-cache postgresql-dev fcgi && docker-php-ext-install pdo_pgsql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY laravel/composer.json laravel/composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-dist

COPY laravel/ .

RUN { echo 'opcache.enable=1'; echo 'opcache.memory_consumption=128'; echo 'opcache.interned_strings_buffer=16'; echo 'opcache.max_accelerated_files=20000'; echo 'opcache.validate_timestamps=0'; echo 'opcache.enable_cli=0'; } > /usr/local/etc/php/conf.d/opcache.ini

RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
