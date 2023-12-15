
import requests
from bs4 import BeautifulSoup

def get_flipkart_price(product_url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'}
    
    response = requests.get(product_url, headers=headers)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Print the entire HTML content for inspection
     

        price = soup.find('div', {'class': '_30jeq3 _16Jk6d'}).text.strip()  # This class may change over time, please check the website HTML
        return price
    else:
        print(f"Failed to fetch the webpage. Status code: {response.status_code}")
        return None

# Replace this URL with the actual Flipkart product URL
product_url = 'https://www.flipkart.com/little-birdie-decor-varnish-gloss-100-ml-gloss/p/itm4d0a1bf6819fd?pid=APVFUHCTUQG4AZ3R&lid=LSTAPVFUHCTUQG4AZ3R1WZCF1&marketplace=FLIPKART&store=dgv&srno=b_1_9&otracker=browse&fm=organic&iid=5791884d-7fd1-4571-b729-66d3b3026db1.APVFUHCTUQG4AZ3R.SEARCH&ppt=hp&ppn=homepage&ssid=qornv66v1s0000001700660376263'
price = get_flipkart_price(product_url)

if price:
    print(f"The current price is: {price}")
else:
    print("Price not available.")
