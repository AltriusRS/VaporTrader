--
-- PostgreSQL database dump
--

-- Dumped from database version 11.7 (Raspbian 11.7-0+deb10u1)
-- Dumped by pg_dump version 12.4 (Ubuntu 12.4-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE DATABASE price_spy WITH TEMPLATE = template0 ENCODING = 'UTF8'  LC_COLLATE = 'c.UTF-8' LC_CTYPE = 'c.UTF-8';



ALTER DATABASE price_spy OWNER TO news_bot;

\connect price_spy

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

--
-- Name: drops; Type: TABLE; Schema: public; Owner: news_bot
--

CREATE TABLE public.drops (
    item_id character varying(32) NOT NULL,
    name character varying(200) NOT NULL
);


ALTER TABLE public.drops OWNER TO news_bot;

--
-- Name: items; Type: TABLE; Schema: public; Owner: news_bot
--

CREATE TABLE public.items (
    id character varying(32) NOT NULL,
    item_name character varying(200) NOT NULL,
    tradable boolean DEFAULT false NOT NULL,
    icon character varying(200),
    url_name character varying(200) NOT NULL,
    wiki_link character varying(200) NOT NULL,
    trade_tax integer
);


ALTER TABLE public.items OWNER TO news_bot;

--
-- Name: price_history; Type: TABLE; Schema: public; Owner: news_bot
--

CREATE TABLE public.price_history (
    item_id character varying(32) NOT NULL,
    avg_price double precision,
    "timestamp" timestamp without time zone NOT NULL,
    highest_price double precision,
    lowest_price double precision
);


ALTER TABLE public.price_history OWNER TO news_bot;

--
-- Data for Name: drops; Type: TABLE DATA; Schema: public; Owner: news_bot
--

COPY public.drops (item_id, name) FROM stdin;
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: news_bot
--

COPY public.items (id, item_name, tradable, icon, url_name, wiki_link, trade_tax) FROM stdin;
\.


--
-- Data for Name: price_history; Type: TABLE DATA; Schema: public; Owner: news_bot
--

COPY public.price_history (item_id, avg_price, "timestamp", highest_price, lowest_price) FROM stdin;
\.


--
-- Name: drops drops_pk; Type: CONSTRAINT; Schema: public; Owner: news_bot
--

ALTER TABLE ONLY public.drops
    ADD CONSTRAINT drops_pk PRIMARY KEY (item_id);


--
-- Name: items items_pk; Type: CONSTRAINT; Schema: public; Owner: news_bot
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pk PRIMARY KEY (id);


--
-- Name: price_history price_history_pk; Type: CONSTRAINT; Schema: public; Owner: news_bot
--

ALTER TABLE ONLY public.price_history
    ADD CONSTRAINT price_history_pk PRIMARY KEY (item_id);


--
-- Name: drops_item_id_uindex; Type: INDEX; Schema: public; Owner: news_bot
--

CREATE UNIQUE INDEX drops_item_id_uindex ON public.drops USING btree (item_id);


--
-- Name: items_id_uindex; Type: INDEX; Schema: public; Owner: news_bot
--

CREATE UNIQUE INDEX items_id_uindex ON public.items USING btree (id);


--
-- PostgreSQL database dump complete
--

