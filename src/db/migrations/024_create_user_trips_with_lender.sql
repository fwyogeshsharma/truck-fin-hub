-- Migration: Create 300+ Trips for Specific Transporter with Lender Integration
-- Date: 2025-10-29
-- Description: Creates 300+ trips for transporter u-1761726616725-79ngqd0bs with lender u-1761737271624-utzb3tkl5
--             Updates all related tables: trips, investments, wallets, transactions
--             Ensures complete data synchronization across the system

-- ============================================================
-- Step 0: CLEANUP - Remove ALL existing data for these users
-- ============================================================

DO $$
DECLARE
  v_trips_deleted INTEGER;
  v_investments_deleted INTEGER;
  v_transactions_deleted INTEGER;
BEGIN
  RAISE NOTICE '🧹 CLEANUP: Starting data cleanup for migration users...';
  RAISE NOTICE '';

  -- Delete transactions for both users
  RAISE NOTICE '   🗑️   Deleting transactions...';
  DELETE FROM transactions
  WHERE user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5')
     OR id LIKE 'txn_%trip_custom_%';
  GET DIAGNOSTICS v_transactions_deleted = ROW_COUNT;
  RAISE NOTICE '      ✅  Deleted % transactions', v_transactions_deleted;

  -- Delete investments for lender
  RAISE NOTICE '   🗑️   Deleting investments...';
  DELETE FROM investments
  WHERE lender_id = 'u-1761737271624-utzb3tkl5'
     OR id LIKE 'inv_trip_custom_%';
  GET DIAGNOSTICS v_investments_deleted = ROW_COUNT;
  RAISE NOTICE '      ✅  Deleted % investments', v_investments_deleted;

  -- Delete trips for transporter/load owner
  RAISE NOTICE '   🗑️   Deleting trips...';
  DELETE FROM trips
  WHERE transporter_id = 'u-1761726616725-79ngqd0bs'
     OR load_owner_id = 'u-1761726616725-79ngqd0bs'
     OR id LIKE 'trip_custom_%';
  GET DIAGNOSTICS v_trips_deleted = ROW_COUNT;
  RAISE NOTICE '      ✅  Deleted % trips', v_trips_deleted;

  -- Reset wallets (keep the records but reset balances)
  RAISE NOTICE '   💰  Resetting wallets...';
  UPDATE wallets
  SET
    balance = 0,
    locked_amount = 0,
    escrowed_amount = 0,
    total_invested = 0,
    total_returns = 0,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5');
  RAISE NOTICE '      ✅  Reset wallet balances to zero';

  RAISE NOTICE '';
  RAISE NOTICE '✅  CLEANUP COMPLETE!';
  RAISE NOTICE '   - Trips deleted: %', v_trips_deleted;
  RAISE NOTICE '   - Investments deleted: %', v_investments_deleted;
  RAISE NOTICE '   - Transactions deleted: %', v_transactions_deleted;
  RAISE NOTICE '';
END $$;

-- ============================================================
-- Step 1: Verify Users Exist (Create if needed)
-- ============================================================

-- Ensure transporter exists (if not, you'll need to create manually)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'u-1761726616725-79ngqd0bs') THEN
    RAISE EXCEPTION 'Transporter user u-1761726616725-79ngqd0bs does not exist. Please create this user first.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = 'u-1761737271624-utzb3tkl5') THEN
    RAISE EXCEPTION 'Lender user u-1761737271624-utzb3tkl5 does not exist. Please create this user first.';
  END IF;

  RAISE NOTICE '✅  Both users verified';
END $$;

-- Ensure wallets exist for both users with sufficient balance
-- Lender needs ~15M to fund 320 trips (avg 50k each), setting to 25M to ensure sufficient funds
INSERT INTO wallets (user_id, balance, locked_amount, escrowed_amount, total_invested, total_returns, updated_at)
VALUES
  ('u-1761726616725-79ngqd0bs', 0, 0, 0, 0, 0, CURRENT_TIMESTAMP),
  ('u-1761737271624-utzb3tkl5', 25000000, 0, 0, 0, 0, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  locked_amount = EXCLUDED.locked_amount,
  escrowed_amount = EXCLUDED.escrowed_amount,
  total_invested = EXCLUDED.total_invested,
  total_returns = EXCLUDED.total_returns,
  updated_at = EXCLUDED.updated_at;

-- ============================================================
-- Step 2: Create 300+ Historical Trips with Complete Data Flow
-- ============================================================
-- Note: Sanjay Singh is both load_owner and transporter
-- ============================================================
DO $$
DECLARE
  trip_counter INTEGER := 0;
  trip_id TEXT;
  trip_date TIMESTAMP;
  trip_status TEXT;
  trip_amount NUMERIC(10,2);
  trip_interest_rate NUMERIC(5,2);
  trip_days INTEGER;
  load_owner_id TEXT;
  load_owner_name TEXT;
  transporter_id TEXT := 'u-1761726616725-79ngqd0bs';
  transporter_name TEXT;
  lender_id TEXT := 'u-1761737271624-utzb3tkl5';
  lender_name TEXT;
  origin_city TEXT;
  destination_city TEXT;
  load_type TEXT;
  distance NUMERIC(10,2);
  weight NUMERIC(10,2);
  risk_level TEXT;
  expected_return NUMERIC(10,2);
  actual_return NUMERIC(10,2);
  platform_fee NUMERIC(10,2);

  -- Get transporter and lender names
  transporter_record RECORD;
  lender_record RECORD;

  -- Arrays for random data generation
  origins TEXT[] := ARRAY[
  'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Chennai, Tamil Nadu',
    'Kolkata, West Bengal', 'Pune, Maharashtra', 'Hyderabad, Telangana', 'Ahmedabad, Gujarat',
    'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh', 'Chandigarh, Punjab', 'Indore, Madhya Pradesh',
    'Kochi, Kerala', 'Coimbatore, Tamil Nadu', 'Nagpur, Maharashtra', 'Vadodara, Gujarat'
  ];

  destinations TEXT[] := ARRAY[
    'Delhi, NCR', 'Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
    'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Ahmedabad, Gujarat', 'Pune, Maharashtra',
    'Surat, Gujarat', 'Nagpur, Maharashtra', 'Visakhapatnam, Andhra Pradesh', 'Bhopal, Madhya Pradesh',
    'Ludhiana, Punjab', 'Agra, Uttar Pradesh', 'Nashik, Maharashtra', 'Rajkot, Gujarat'
  ];

  load_types TEXT[] := ARRAY[
    'Electronics', 'FMCG', 'Textiles', 'Machinery', 'Pharmaceuticals',
    'Automotive Parts', 'Food Grains', 'Building Materials', 'Chemicals',
    'Consumer Goods', 'Steel', 'Cement', 'Furniture', 'Paper Products'
  ];

  client_companies TEXT[] := ARRAY[
    'Tata Motors', 'Reliance Industries', 'ITC Limited', 'Berger Paints',
    'Asian Paints', 'Hindustan Unilever', 'Mahindra & Mahindra', 'L&T Construction',
    'Godrej Industries', 'Aditya Birla Group', 'JSW Steel', 'Ultratech Cement',
    'Wipro', 'Infosys', 'Amazon India', 'Flipkart', 'BigBasket', 'Myntra'
  ];

  status_rand NUMERIC;
  lender_wallet_balance NUMERIC(10,2);
  transporter_wallet_balance NUMERIC(10,2);

BEGIN
  -- Get transporter and lender information
  SELECT name INTO transporter_name FROM users WHERE id = transporter_id;
  SELECT name INTO lender_name FROM users WHERE id = lender_id;
  -- Get initial wallet balances
  SELECT balance INTO lender_wallet_balance FROM wallets WHERE user_id = lender_id;
  SELECT balance INTO transporter_wallet_balance FROM wallets WHERE user_id = transporter_id;

  IF lender_wallet_balance IS NULL THEN
    lender_wallet_balance := 500000;
  END IF;

  IF transporter_wallet_balance IS NULL THEN
    transporter_wallet_balance := 0;
  END IF;

  RAISE NOTICE '📊  Starting migration with:';
  RAISE NOTICE '   Transporter: % (ID: %)', transporter_name, transporter_id;
  RAISE NOTICE '   Lender: % (ID: %)', lender_name, lender_id;
  RAISE NOTICE '   Lender Initial Balance: ₹%', lender_wallet_balance;
  RAISE NOTICE '';

  -- Loop to create 320 trips
  FOR trip_counter IN 1..320 LOOP
    trip_id := 'trip_custom_' || LPAD(trip_counter::TEXT, 4, '0');

    -- Generate random date between 10 months ago and 1 day ago
    trip_date := CURRENT_TIMESTAMP - (INTERVAL '1 day' * (1 + floor(random() * 300)::INTEGER));

    -- Status distribution:
    -- 45% completed/repaid (older trips)
    -- 30% funded/active
    -- 15% in_transit
    -- 10% escrowed/pending
    status_rand := random();
    IF status_rand < 0.45 THEN
      -- All older trips are completed
      trip_status := 'completed';
    ELSIF status_rand < 0.75 THEN
      trip_status := 'funded';
    ELSIF status_rand < 0.90 THEN
      trip_status := 'in_transit';
    ELSIF status_rand < 0.95 THEN
      trip_status := 'escrowed';
    ELSE
      trip_status := 'pending';
    END IF;

    -- Random trip amount between 20,000 and 80,000
    trip_amount := 20000 + (random() * 60000)::INTEGER;
    trip_amount := ROUND(trip_amount / 1000) * 1000;

    -- Random maturity days (15-45 days)
    trip_days := 15 + floor(random() * 30)::INTEGER;

    -- Random annual interest rate between 2% and 5%
    -- This is the ARR (Annual Rate of Return)
    trip_interest_rate := 2 + (random() * 3); -- 2% to 5% annually
    trip_interest_rate := ROUND(trip_interest_rate * 2) / 2; -- Round to nearest 0.5

    -- Set Sanjay Singh as both load owner and transporter
    load_owner_id := transporter_id;
    load_owner_name := transporter_name;

    -- Random origin and destination
    origin_city := origins[1 + floor(random() * array_length(origins, 1))::INTEGER];
    destination_city := destinations[1 + floor(random() * array_length(destinations, 1))::INTEGER];

    -- Ensure origin != destination
    WHILE origin_city = destination_city LOOP
      destination_city := destinations[1 + floor(random() * array_length(destinations, 1))::INTEGER];
    END LOOP;

    -- Random load type
    load_type := load_types[1 + floor(random() * array_length(load_types, 1))::INTEGER];

    -- Random distance between 400 and 2800 km
    distance := 400 + (random() * 2400);
    distance := ROUND(distance / 10) * 10;

    -- Random weight between 5000 and 28000 kg
    weight := 5000 + (random() * 23000);
    weight := ROUND(weight / 100) * 100;

    -- Random risk level
    risk_level := CASE floor(random() * 3)::INTEGER
      WHEN 0 THEN 'low'
      WHEN 1 THEN 'medium'
      ELSE 'high'
    END;

    -- Calculate expected return
    expected_return := trip_amount + (trip_amount * trip_interest_rate * trip_days / (100 * 365));
    expected_return := ROUND(expected_return, 2);

    -- Platform fee (2% of loan amount)
    platform_fee := ROUND(trip_amount * 0.02, 2);

    -- Insert trip
    INSERT INTO trips (
      id,
      load_owner_id,
      load_owner_name,
      load_owner_logo,
      load_owner_rating,
      client_company,
      transporter_id,
      transporter_name,
      origin,
      destination,
      distance,
      load_type,
      weight,
      amount,
      interest_rate,
      maturity_days,
      risk_level,
      insurance_status,
      status,
      lender_id,
      lender_name,
      created_at,
      funded_at,
      completed_at
    ) VALUES (
      trip_id,
      load_owner_id,
      load_owner_name,
      NULL,
      4.0 + (random() * 1.0),
      client_companies[1 + floor(random() * array_length(client_companies, 1))::INTEGER],
      transporter_id,
      transporter_name,
      origin_city,
      destination_city,
       distance,
      load_type,
      weight,
      trip_amount,
      trip_interest_rate,
      trip_days,
      risk_level,
      random() > 0.25, -- 75% insured
      trip_status,
      CASE WHEN trip_status IN ('funded', 'completed', 'in_transit', 'escrowed') THEN lender_id ELSE NULL END,
      CASE WHEN trip_status IN ('funded', 'completed', 'in_transit', 'escrowed') THEN lender_name ELSE NULL END,
      trip_date,
      CASE WHEN trip_status IN ('funded', 'completed', 'in_transit', 'escrowed') THEN trip_date + INTERVAL '3 hours' ELSE NULL END,
      CASE WHEN trip_status = 'completed' THEN trip_date + (trip_days || ' days')::INTERVAL ELSE NULL END
    );

    -- ============================================================
    -- For funded/escrowed trips: Create investments and update wallets
    -- ============================================================
    IF trip_status IN ('funded', 'completed', 'in_transit', 'escrowed') THEN

      -- Create investment record
      INSERT INTO investments (
        id,
        lender_id,
        trip_id,
        amount,
        interest_rate,
        expected_return,
        status,
        invested_at,
        maturity_date,
        completed_at
      ) VALUES (
        'inv_' || trip_id,
        lender_id,
        trip_id,
        trip_amount,
        trip_interest_rate,
        expected_return,
        CASE
          WHEN trip_status = 'escrowed' THEN 'escrowed'
          WHEN trip_status = 'funded' THEN 'active'
          WHEN trip_status = 'in_transit' THEN 'active'
          WHEN trip_status = 'completed' THEN 'completed'
          ELSE 'active'
        END,
        trip_date + INTERVAL '3 hours',
        trip_date + (trip_days || ' days')::INTERVAL,
        CASE WHEN trip_status = 'completed' THEN trip_date + (trip_days || ' days')::INTERVAL + INTERVAL '1 day' ELSE NULL END
      );

      -- Lender: Debit from wallet (investment)
      lender_wallet_balance := lender_wallet_balance - trip_amount;

      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        category,
        description,
        balance_after,
        timestamp
      ) VALUES (
        'txn_lender_inv_' || trip_id,
        lender_id,
        'debit',
        trip_amount,
        'investment',
        'Investment in trip ' || trip_id || ' - ' || origin_city || ' to ' || destination_city,
        lender_wallet_balance,
        trip_date + INTERVAL '3 hours'
         );

    END IF;

    -- ============================================================
    -- For funded trips: Credit transporter (loan disbursement minus fee)
    -- ============================================================
    IF trip_status IN ('funded', 'in_transit', 'completed') THEN

      -- Transporter receives loan amount minus platform fee
      actual_return := trip_amount - platform_fee;
      transporter_wallet_balance := transporter_wallet_balance + actual_return;

      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        category,
        description,
        balance_after,
        timestamp
      ) VALUES (
        'txn_trans_loan_' || trip_id,
        transporter_id,
        'credit',
        actual_return,
        'payment',
        'Loan disbursement for trip ' || trip_id || ' (Amount: ₹' || trip_amount || ' - Fee: ₹' || platform_fee || ')',
        transporter_wallet_balance,
        trip_date + INTERVAL '4 hours'
      );

      -- Platform fee transaction
      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        category,
        description,
        balance_after,
        timestamp
      ) VALUES (
        'txn_trans_fee_' || trip_id,
        transporter_id,
        'debit',
        platform_fee,
        'fee',
        'Platform fee for trip ' || trip_id || ' (2% of ₹' || trip_amount || ')',
        transporter_wallet_balance,
        trip_date + INTERVAL '4 hours'
      );

    END IF;

    -- ============================================================
    -- For completed trips: Handle repayments
    -- ============================================================
    IF trip_status = 'completed' THEN

      -- Calculate actual interest
      actual_return := expected_return;

      -- Note: Trip repayment info is tracked via transactions and investment completion
      -- The trips table doesn't have repayment-specific columns

      -- Transporter: Debit wallet (loan repayment)
      transporter_wallet_balance := transporter_wallet_balance - actual_return;

      INSERT INTO transactions (
      id,
        user_id,
        type,
        amount,
        category,
        description,
        balance_after,
        timestamp
      ) VALUES (
        'txn_trans_repay_' || trip_id,
        transporter_id,
        'debit',
        actual_return,
        'payment',
        'Loan repayment for trip ' || trip_id || ' (Principal: ₹' || trip_amount || ' + Interest: ₹' || ROUND(actual_return - trip_amount, 2) || ')',
        transporter_wallet_balance,
        trip_date + (trip_days || ' days')::INTERVAL + INTERVAL '1 day'
      );

      -- Lender: Credit wallet (return on investment)
      lender_wallet_balance := lender_wallet_balance + actual_return;

      INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        category,
        description,
        balance_after,
        timestamp
      ) VALUES (
        'txn_lender_return_' || trip_id,
        lender_id,
        'credit',
        actual_return,
        'return',
        'Investment return from trip ' || trip_id || ' (ROI: ' || ROUND(((actual_return - trip_amount) / trip_amount) * 100, 2) || '%)',
        lender_wallet_balance,
        trip_date + (trip_days || ' days')::INTERVAL + INTERVAL '2 days'
      );

    END IF;

  END LOOP;

  RAISE NOTICE '✅  Created 320 trips for transporter %', transporter_id;
  RAISE NOTICE '';

  -- ============================================================
  -- Step 4: Update Wallet Balances
  -- ============================================================

  -- Update lender wallet
  UPDATE wallets
  SET
    balance = lender_wallet_balance,
    total_invested = (
      SELECT COALESCE(SUM(i.amount), 0)
      FROM investments i
      WHERE i.lender_id = 'u-1761737271624-utzb3tkl5'
    ),
    total_returns = (
      SELECT COALESCE(SUM(t.amount), 0)
      FROM transactions t
      WHERE t.user_id = 'u-1761737271624-utzb3tkl5'
        AND t.type = 'credit'
        AND t.category = 'return'
    ),
    escrowed_amount = (
      SELECT COALESCE(SUM(i.amount), 0)
      FROM investments i
      WHERE i.lender_id = 'u-1761737271624-utzb3tkl5'
      AND i.status = 'escrowed'
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = 'u-1761737271624-utzb3tkl5';

  -- Update transporter wallet
  UPDATE wallets
  SET
    balance = transporter_wallet_balance,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = 'u-1761726616725-79ngqd0bs';

  RAISE NOTICE '✅  Updated wallet balances';
  RAISE NOTICE '   Lender Final Balance: ₹%', lender_wallet_balance;
  RAISE NOTICE '   Transporter Final Balance: ₹%', transporter_wallet_balance;
  RAISE NOTICE '';

END $$;

-- ============================================================
-- Step 5: Generate Summary Statistics
-- ============================================================

DO $$
DECLARE
  summary_record RECORD;
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '📊  MIGRATION SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Trip Statistics
  RAISE NOTICE '🚛  TRIP STATISTICS:';
  FOR summary_record IN
    SELECT
    status,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM trips
    WHERE transporter_id = 'u-1761726616725-79ngqd0bs'
    GROUP BY status
    ORDER BY count DESC
  LOOP
    RAISE NOTICE '   % : % trips (₹%)',
      RPAD(summary_record.status, 15),
      LPAD(summary_record.count::TEXT, 4),
      summary_record.total_amount;
  END LOOP;
  RAISE NOTICE '';

  -- Total trips
  SELECT
    COUNT(*) as total_trips,
    SUM(amount) as total_loan_value,
    AVG(interest_rate) as avg_interest_rate,
    AVG(maturity_days) as avg_days
  INTO summary_record
  FROM trips
  WHERE transporter_id = 'u-1761726616725-79ngqd0bs';

  RAISE NOTICE '   Total Trips      : %', summary_record.total_trips;
  RAISE NOTICE '   Total Loan Value : ₹%', summary_record.total_loan_value;
  RAISE NOTICE '   Avg Interest Rate: %', ROUND(summary_record.avg_interest_rate, 2) || '%';
  RAISE NOTICE '   Avg Duration     : % days', ROUND(summary_record.avg_days);
  RAISE NOTICE '';

  -- Investment Statistics
  RAISE NOTICE '💰  INVESTMENT STATISTICS:';
  SELECT
    COUNT(*) as total_investments,
    SUM(amount) as total_invested,
    SUM(expected_return) as total_expected_return,
    SUM(expected_return - amount) as total_expected_interest
  INTO summary_record
  FROM investments
  WHERE lender_id = 'u-1761737271624-utzb3tkl5';

  RAISE NOTICE '   Total Investments       : %', summary_record.total_investments;
  RAISE NOTICE '   Total Amount Invested   : ₹%', summary_record.total_invested;
  RAISE NOTICE '   Total Expected Returns  : ₹%', summary_record.total_expected_return;
  RAISE NOTICE '   Total Expected Interest : ₹%', summary_record.total_expected_interest;
  RAISE NOTICE '';

  -- Wallet Balances
  RAISE NOTICE '👛  WALLET BALANCES:';
  FOR summary_record IN
    SELECT
      u.name,
      w.balance,
      w.escrowed_amount,
      w.total_invested,
      w.total_returns
    FROM wallets w
    JOIN users u ON u.id = w.user_id
    WHERE w.user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5')
  LOOP
    RAISE NOTICE '   %:', summary_record.name;
    RAISE NOTICE '      Current Balance : ₹%', summary_record.balance;
    RAISE NOTICE '      Escrowed Amount : ₹%', summary_record.escrowed_amount;
    RAISE NOTICE '      Total Invested  : ₹%', summary_record.total_invested;
    RAISE NOTICE '      Total Returns   : ₹%', summary_record.total_returns;
    RAISE NOTICE '';
  END LOOP;
  -- Transaction Counts
  RAISE NOTICE '📝  TRANSACTION COUNTS:';
  SELECT
    COUNT(*) as total_transactions
  INTO summary_record
  FROM transactions
  WHERE user_id IN ('u-1761726616725-79ngqd0bs', 'u-1761737271624-utzb3tkl5');

  RAISE NOTICE '   Total Transactions: %', summary_record.total_transactions;
  RAISE NOTICE '';

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅  Migration completed successfully!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
