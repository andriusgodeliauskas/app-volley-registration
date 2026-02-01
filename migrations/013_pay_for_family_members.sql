-- Migration: Pay for Family Members Feature
-- Date: 2026-02-01
-- Description: Prideda galimybę tėvams mokėti už šeimos narius su skaidriomis transakcijomis
--              Kai įjungta, sukuriamos trys transakcijos: pervedimas + gavimas + mokėjimas
--              Rezultatas: tėvas -€10, vaikas ±0, bet matoma pinigų kelias

-- ============================================
-- Modify users table - pridėti pay_for_family_members lauką
-- ============================================

ALTER TABLE users
ADD COLUMN pay_for_family_members TINYINT(1) DEFAULT 1
COMMENT 'Kai 1, tėvas moka už šeimos narius su skaidriomis transakcijomis (pervedimas + gavimas + mokėjimas). Kai 0, sena logika - tiesioginis mokėjimas';

-- ============================================
-- Verification Queries
-- ============================================

-- Patikrinti, ar stulpelis pridėtas
SHOW COLUMNS FROM users WHERE Field = 'pay_for_family_members';

-- Patikrinti, ar visi esami vartotojai turi reikšmę 1 (įjungta pagal nutylėjimą)
SELECT
    id,
    name,
    email,
    pay_for_family_members
FROM users
LIMIT 10;

-- Suskaičiuoti kiek vartotojų turi įjungtą funkciją
SELECT
    pay_for_family_members,
    COUNT(*) as user_count
FROM users
GROUP BY pay_for_family_members;

-- ============================================
-- Usage Examples
-- ============================================

-- Pavyzdys 1: Išjungti funkciją konkrečiam vartotojui
-- UPDATE users SET pay_for_family_members = 0 WHERE id = 123;

-- Pavyzdys 2: Gauti vartotojus, kuriems įjungta funkcija
-- SELECT id, name, email, pay_for_family_members
-- FROM users
-- WHERE pay_for_family_members = 1;

-- Pavyzdys 3: Patikrinti vartotojo nustatymus prieš kuriant transakcijas
-- SELECT pay_for_family_members FROM users WHERE id = ?;

-- ============================================
-- Transaction Flow Example
-- ============================================

-- Kai pay_for_family_members = 1 (NAUJA LOGIKA):
-- Registration: Parent registers child for €10 event
-- On event finalize:
--   1. Parent (id=100): -€10, type='family_transfer', description='Transfer to Petras for: Volleyball Game'
--   2. Child  (id=200): +€10, type='family_transfer', description='Transfer from Jonas for: Volleyball Game'
--   3. Child  (id=200): -€10, type='payment', description='Payment for: Volleyball Game'
-- Result: Parent balance -€10, Child balance ±0 (transparent flow)

-- Kai pay_for_family_members = 0 (SENA LOGIKA):
-- On event finalize:
--   1. Parent (id=100): -€10, type='payment', description='Payment for: Volleyball Game (už Petras)'
-- Result: Parent balance -€10 (simple direct payment)
