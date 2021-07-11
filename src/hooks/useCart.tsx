import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart');

     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      api.get(`products/${productId}`).then(response => {
        
        let product = cart.find(product => product.id === productId);
        if(!product) {
          let tempCart = [...cart, { 
            id: response.data.id,
            title: response.data.title,
            price: response.data.price,
            image: response.data.image,
            amount: 1 
          }]

          setCart(tempCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
        } else{
          updateProductAmount({ productId: productId, amount: product.amount + 1});
        }
      }).catch(e => toast.error('Erro na adição do produto'))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let product = cart.find(product => product.id === productId);

      if(!product){
        toast.error('Erro na remoção do produto');
        return;
      }

      let tempCart = cart.filter((product) => product.id !== productId)
      setCart(tempCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
    try {
      if(amount === 0)
        return;

      api.get(`stock/${productId}`).then(response => {
        if(response.data.amount >= amount) {

          let tempCart = cart.map(product => { return (product.id === productId ? {...product, amount : amount} : product);  });

          setCart(tempCart)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(tempCart));
        } else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }).catch(e => toast.error('Erro na alteração de quantidade do produto'))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}