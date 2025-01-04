import backoff
import requests

from core.logger import get_logger
from core.util.tracking import fivetran_track
from core.v4.dataset_comp.integrations.util import Integration
from core.v4.mavis import Mavis

logger = get_logger()


INCOME_STATMENT = "https://webhooks.fivetran.com/webhooks/3b757c29-6659-49db-8ea9-987af020794a"

BALANCE_SHEET = "https://webhooks.fivetran.com/webhooks/bce2f91b-37e9-4c04-a01e-3b990cea49d5"

CASH_FLOW = "https://webhooks.fivetran.com/webhooks/6039f175-bfb5-4373-9215-82167cda93e5"

field_mapping = {
    "balance_sheet": {
        "Assets": "total_assets",
        "AssetsCurrent": "current_assets",
        "CashAndCashEquivalentsAtCarryingValue": "cash_and_equivalents",
        "InventoryNet": "inventory",
        "MarketableSecuritiesCurrent": "current_investments",
        "AccountsReceivableNetCurrent": "trade_and_non_trade_receivables",
        "AssetsNoncurrent": "non_current_assets",
        "PropertyPlantAndEquipmentNet": "property_plant_and_equipment",
        "GoodwillAndIntangibleAssetsNet": "goodwill_and_intangible_assets",
        "InvestmentsInDebtAndMarketableEquitySecuritiesNet": "investments",
        "InvestmentsInDebtAndMarketableEquitySecuritiesNoncurrent": "non_current_investments",
        "CommonStockSharesOutstanding": "outstanding_shares",
        "DeferredTaxAssetsNet": "tax_assets",
        "Liabilities": "total_liabilities",
        "LiabilitiesCurrent": "current_liabilities",
        "DebtCurrent": "current_debt",
        "AccountsPayableCurrent": "trade_and_non_trade_payables",
        "DeferredRevenue": "deferred_revenue",
        "DepositsLiabilities": "deposit_liabilities",
        "LiabilitiesNoncurrent": "non_current_liabilities",
        "LongTermDebt": "non_current_debt",
        "DeferredTaxLiabilities": "tax_liabilities",
        "StockholdersEquity": "shareholders_equity",
        "RetainedEarningsAccumulatedDeficit": "retained_earnings",
        "AccumulatedOtherComprehensiveIncomeLossNetOfTax": "accumulated_other_comprehensive_income",
        "DebtAndCapitalLeaseObligations": "total_debt",
    },
    "income_statement": {
        "Revenues": "revenue",
        "CostOfRevenue": "cost_of_revenue",
        "GrossProfit": "gross_profit",
        "OperatingExpenses": "operating_expense",
        "SellingGeneralAndAdministrativeExpense": "selling_general_and_administrative_expenses",
        "ResearchAndDevelopmentExpense": "research_and_development",
        "OperatingIncomeLoss": "operating_income",
        "InterestExpense": "interest_expense",
        "EarningsBeforeInterestAndTaxes": "ebit",
        "IncomeTaxExpenseBenefit": "income_tax_expense",
        "IncomeLossFromDiscontinuedOperationsNetOfTax": "net_income_discontinued_operations",
        "NetIncomeLossAttributableToNoncontrollingInterest": "net_income_non_controlling_interests",
        "NetIncomeLoss": "net_income",
        "NetIncomeLossAvailableToCommonStockholdersBasic": "net_income_common_stock",
        "PreferredStockDividendsAndOtherAdjustments": "preferred_dividends_impact",
        "ComprehensiveIncomeNetOfTax": "consolidated_income",
        "EarningsPerShareBasic": "earnings_per_share",
        "EarningsPerShareDiluted": "earnings_per_share_diluted",
        "DividendsCommonStockCashPaid": "dividends_per_common_share",
        "WeightedAverageNumberOfSharesOutstandingBasic": "weighted_average_shares",
        "WeightedAverageNumberOfDilutedSharesOutstanding": "weighted_average_shares_diluted",
    },
    "cash_flow": {
        "NetCashProvidedByUsedInOperatingActivities": "net_cash_flow_from_operations",
        "DepreciationDepletionAndAmortization": "depreciation_and_amortization",
        "ShareBasedCompensation": "share_based_compensation",
        "NetCashProvidedByUsedInInvestingActivities": "net_cash_flow_from_investing",
        "PaymentsToAcquirePropertyPlantAndEquipment": "capital_expenditure",
        "PaymentsToAcquireBusinessesNetOfCashAcquired": "business_acquisitions_and_disposals",
        "PaymentsToAcquireInvestments": "investment_acquisitions_and_disposals",
        "NetCashProvidedByUsedInFinancingActivities": "net_cash_flow_from_financing",
        "ProceedsFromIssuanceOfDebt": "issuance_or_repayment_of_debt_securities",
        "ProceedsFromIssuanceOfCommonStock": "issuance_or_purchase_of_equity_shares",
        "PaymentsOfDividends": "dividends_and_other_cash_distributions",
        "CashAndCashEquivalentsPeriodIncreaseDecrease": "change_in_cash_and_equivalents",
        "EffectOfExchangeRateOnCashAndCashEquivalents": "effect_of_exchange_rate_changes",
    },
}


@backoff.on_exception(backoff.constant, Exception, max_tries=2, logger=logger)
def get_company_facts(cik):
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    headers = {
        "User-Agent": "Ahmed Elsamadisi ahmed@narrator.ai"  # Replace with your information
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to retrieve data: {response.status_code}")


def parse_fact_data(facts, start_date: str = "1900-01-01"):
    balance_sheet = {}
    income_statement = {}
    cash_flow = {}
    for statement_type, mapping in field_mapping.items():
        for concept, data in facts["facts"]["us-gaap"].items():
            if concept in mapping:
                for unit_data in data["units"].values():
                    for entry in unit_data:
                        if entry["end"] >= start_date and "frame" not in entry:
                            if entry["end"] not in locals()[statement_type]:
                                locals()[statement_type][entry["end"]] = {}
                            locals()[statement_type][entry["end"]][mapping[concept]] = entry["val"]

    return balance_sheet, income_statement, cash_flow


def track_income(mavis: Mavis, cik: str, income: dict, url: str):
    for k, val in income.items():
        fivetran_track(
            mavis.user,
            url,
            {**val, "calendar_date": k, "cik": cik, "version": 0.4},
            retry=3,
        )


class TrackFinancial(Integration):
    @property
    def details(self):
        return self.mat.details

    def run(self):
        is_last = False
        offset = 0

        while not is_last:
            raw_data = self.fetch_data(offset=offset)
            for r in raw_data.rows:
                logger.debug("Running the data for ", cik=r["cik"])
                try:
                    facts = get_company_facts(r["cik"])
                except Exception as e:
                    logger.error(f"Failed to retrieve data for {r['cik']}: {e}")
                    continue

                if "us-gaap" not in facts["facts"].keys():
                    logger.error(f"Failed to retrieve data for {r['cik']}: No us-gaap data")
                    continue

                balance_sheet, income_statement, cash_flow = parse_fact_data(facts)
                track_income(self.mavis, r["cik"], balance_sheet, BALANCE_SHEET)
                track_income(self.mavis, r["cik"], income_statement, INCOME_STATMENT)
                track_income(self.mavis, r["cik"], cash_flow, CASH_FLOW)

            offset += raw_data.total_rows
            is_last = raw_data.context.is_all
